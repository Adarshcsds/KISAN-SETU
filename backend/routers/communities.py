import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.auth import get_current_user, require_roles
from backend.database import get_connection
from backend.models import Community, CreateCommunityRequest, CommunityMember

router = APIRouter(prefix="/communities", tags=["Farmer Communities"])


def _community(row):
    """Convert database row to Community model."""
    return Community(
        id=str(row[0]),
        name=row[1],
        description=row[2],
        location=row[3],
        district=row[4],
        state=row[5],
        cropFocus=row[6],
        leaderId=str(row[7]),
        status=row[8],
        memberCount=row[9],
        createdAt=row[10].isoformat() if row[10] else datetime.now(timezone.utc).isoformat(),
        updatedAt=row[11].isoformat() if row[11] else None
    )


def _community_member(row):
    """Convert database row to CommunityMember model."""
    return CommunityMember(
        communityId=str(row[1]),
        farmerId=str(row[2]),
        farmerName=row[3] if len(row) > 3 else None,
        role=row[4],
        joinedAt=row[5].isoformat() if len(row) > 5 and row[5] else datetime.now(timezone.utc).isoformat()
    )


@router.post("", status_code=201)
def create_community(body: CreateCommunityRequest, user=Depends(require_roles("farmer"))):
    """Create a new farmer community (user becomes leader)."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            community_id = str(uuid.uuid4())
            
            # Create community
            cur.execute("""
                INSERT INTO communities 
                (id, name, description, location, district, state, crop_focus, leader_id, status, member_count, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'ACTIVE', 1, NOW(), NOW())
            """, (community_id, body.name.strip(), body.description, body.location.strip(), 
                  body.district.strip(), body.state.strip(), body.cropFocus))
            
            # Add creator as leader/member
            cur.execute("""
                INSERT INTO community_members (community_id, farmer_id, role, joined_at)
                VALUES (%s, %s, 'LEADER', NOW())
            """, (community_id, user["id"]))
            
            # Fetch and return
            cur.execute("""
                SELECT id, name, description, location, district, state, crop_focus, leader_id, 
                       status, member_count, created_at, updated_at
                FROM communities WHERE id=%s
            """, (community_id,))
            row = cur.fetchone()
        conn.commit()
        return _community(row)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.get("")
def list_communities(user=Depends(get_current_user)):
    """List all communities (farmers see all, others see ones they're part of)."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if user["role"] == "farmer":
                # Show all active communities + ones user is a member of
                cur.execute("""
                    SELECT DISTINCT c.id, c.name, c.description, c.location, c.district, c.state, 
                           c.crop_focus, c.leader_id, c.status, c.member_count, c.created_at, c.updated_at
                    FROM communities c
                    LEFT JOIN community_members cm ON cm.community_id = c.id AND cm.farmer_id = %s
                    WHERE c.status = 'ACTIVE' OR cm.farmer_id = %s
                    ORDER BY c.created_at DESC
                """, (user["id"], user["id"]))
            else:
                # Non-farmers can list all active communities
                cur.execute("""
                    SELECT id, name, description, location, district, state, crop_focus, leader_id, 
                           status, member_count, created_at, updated_at
                    FROM communities WHERE status='ACTIVE' ORDER BY created_at DESC
                """)
            
            return [_community(row) for row in cur.fetchall()]
    finally:
        conn.close()


@router.get("/{community_id}")
def get_community(community_id: str, user=Depends(get_current_user)):
    """Get community details with member list."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, name, description, location, district, state, crop_focus, leader_id, 
                       status, member_count, created_at, updated_at
                FROM communities WHERE id=%s
            """, (community_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(404, "Community not found")
            
            # Get members
            cur.execute("""
                SELECT cm.id, cm.community_id, cm.farmer_id, u.name, cm.role, cm.joined_at
                FROM community_members cm
                JOIN users u ON u.id = cm.farmer_id
                WHERE cm.community_id = %s
                ORDER BY cm.role DESC, cm.joined_at ASC
            """, (community_id,))
            members = [_community_member(m) for m in cur.fetchall()]
            
            community = _community(row)
            return {"community": community, "members": members}
    finally:
        conn.close()


@router.post("/{community_id}/join", status_code=201)
def join_community(community_id: str, user=Depends(require_roles("farmer"))):
    """Farmer joins an existing community."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Verify community exists and is active
            cur.execute("SELECT id, status FROM communities WHERE id=%s", (community_id,))
            community = cur.fetchone()
            if not community:
                raise HTTPException(404, "Community not found")
            if community[1] != "ACTIVE":
                raise HTTPException(409, "Community is not accepting new members")
            
            # Check if already a member
            cur.execute("""
                SELECT id FROM community_members 
                WHERE community_id=%s AND farmer_id=%s
            """, (community_id, user["id"]))
            if cur.fetchone():
                raise HTTPException(409, "You are already a member of this community")
            
            # Add member
            cur.execute("""
                INSERT INTO community_members (community_id, farmer_id, role, joined_at)
                VALUES (%s, %s, 'MEMBER', NOW())
            """, (community_id, user["id"]))
            
            # Increment member count
            cur.execute("""
                UPDATE communities SET member_count = member_count + 1, updated_at=NOW()
                WHERE id=%s
            """, (community_id,))
            
            # Fetch and return updated community
            cur.execute("""
                SELECT id, name, description, location, district, state, crop_focus, leader_id, 
                       status, member_count, created_at, updated_at
                FROM communities WHERE id=%s
            """, (community_id,))
            row = cur.fetchone()
        conn.commit()
        return _community(row)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.post("/{community_id}/leave")
def leave_community(community_id: str, user=Depends(require_roles("farmer"))):
    """Farmer leaves a community (leader cannot leave)."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Check membership and role
            cur.execute("""
                SELECT id, role FROM community_members 
                WHERE community_id=%s AND farmer_id=%s
            """, (community_id, user["id"]))
            member = cur.fetchone()
            if not member:
                raise HTTPException(404, "You are not a member of this community")
            if member[1] == "LEADER":
                raise HTTPException(409, "Community leader cannot leave without transferring leadership")
            
            # Remove member
            cur.execute("""
                DELETE FROM community_members 
                WHERE community_id=%s AND farmer_id=%s
            """, (community_id, user["id"]))
            
            # Decrement member count
            cur.execute("""
                UPDATE communities SET member_count = GREATEST(0, member_count - 1), updated_at=NOW()
                WHERE id=%s
            """, (community_id,))
            
            # Fetch and return updated community
            cur.execute("""
                SELECT id, name, description, location, district, state, crop_focus, leader_id, 
                       status, member_count, created_at, updated_at
                FROM communities WHERE id=%s
            """, (community_id,))
            row = cur.fetchone()
        conn.commit()
        return _community(row)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.post("/{community_id}/transfer-leadership")
def transfer_leadership(community_id: str, new_leader_id: str, user=Depends(require_roles("farmer"))):
    """Community leader transfers leadership to another member."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Verify current user is leader
            cur.execute("""
                SELECT id, role FROM community_members 
                WHERE community_id=%s AND farmer_id=%s
            """, (community_id, user["id"]))
            current_member = cur.fetchone()
            if not current_member or current_member[1] != "LEADER":
                raise HTTPException(403, "Only community leader can transfer leadership")
            
            # Verify new leader is a member
            cur.execute("""
                SELECT id FROM community_members 
                WHERE community_id=%s AND farmer_id=%s
            """, (community_id, new_leader_id))
            if not cur.fetchone():
                raise HTTPException(422, "New leader must be a community member")
            
            # Update leadership
            cur.execute("""
                UPDATE community_members SET role='MEMBER', updated_at=NOW()
                WHERE community_id=%s AND farmer_id=%s
            """, (community_id, user["id"]))
            
            cur.execute("""
                UPDATE community_members SET role='LEADER', updated_at=NOW()
                WHERE community_id=%s AND farmer_id=%s
            """, (community_id, new_leader_id))
            
            cur.execute("""
                UPDATE communities SET leader_id=%s, updated_at=NOW()
                WHERE id=%s
            """, (new_leader_id, community_id))
            
            # Fetch and return
            cur.execute("""
                SELECT id, name, description, location, district, state, crop_focus, leader_id, 
                       status, member_count, created_at, updated_at
                FROM communities WHERE id=%s
            """, (community_id,))
            row = cur.fetchone()
        conn.commit()
        return _community(row)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
