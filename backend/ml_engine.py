import math
from typing import List
from backend.data_store import db
from backend.models import MarketRealizationItem, ForecastResponse, PriceForecastPoint

class MLEngine:
    @staticmethod
    def get_grade_multiplier(quality_grade: str) -> float:
        if quality_grade == "Grade A (Export)":
            return 1.03
        elif quality_grade == "Grade B (Premium)":
            return 1.00
        else:
            return 0.95

    @classmethod
    def calculate_market_rankings(
        cls, 
        crop_id: str, 
        quantity: float, 
        expected_loss_percent: float, 
        quality_grade: str, 
        max_distance_km: int = 300
    ) -> List[MarketRealizationItem]:
        commodity = db.commodities.get(crop_id) or db.commodities["wheat"]
        multiplier = cls.get_grade_multiplier(quality_grade)
        
        valid_mandis = [m for m in db.mandis.values() if m.distanceKm <= max_distance_km]
        results: List[MarketRealizationItem] = []

        for mandi in valid_mandis:
            base_price = commodity.currentAvgPrice + (mandi.modalPrice - 2450.0) * 0.8
            adjusted_price = round(base_price * multiplier)
            
            # Volume after transit loss
            effective_volume = quantity * (1.0 - (expected_loss_percent / 100.0))
            gross = round(effective_volume * adjusted_price)
            
            # Organized freight formula: Base ₹600 + ₹26/km
            freight = round(600.0 + (mandi.distanceKm * 26.0))
            
            # Cess & handling
            cess = gross * (mandi.mandiCessPercent / 100.0)
            handling = quantity * mandi.avgHandlingCostPerQuintal
            total_handling = round(cess + handling)
            
            loss_val = round((quantity - effective_volume) * adjusted_price)
            net = round(gross - freight - total_handling)
            net_rate_qtl = round(net / quantity) if quantity > 0 else 0

            results.append(MarketRealizationItem(
                mandi=mandi,
                grossPricePerQuintal=adjusted_price,
                effectiveVolumeQuintals=effective_volume,
                grossRealization=gross,
                freightCost=freight,
                handlingCost=total_handling,
                lossValue=loss_val,
                netRealization=net,
                netRatePerQuintal=net_rate_qtl,
                isRecommended=False,
                gainVsLocal=0.0
            ))

        # Sort descending by Net Realization
        results.sort(key=lambda x: x.netRealization, reverse=True)

        if results:
            results[0].isRecommended = True
            baseline_net = results[-1].netRealization
            for r in results:
                r.gainVsLocal = max(0.0, float(r.netRealization - baseline_net))

        return results

    @classmethod
    def get_forecast_advisory(cls, crop_id: str) -> ForecastResponse:
        commodity = db.commodities.get(crop_id) or db.commodities["wheat"]
        points = db.forecast_data.get(crop_id) or db.forecast_data["wheat"]
        
        current_price = commodity.currentAvgPrice
        last_forecast = points[-1].forecastPrice if points else current_price * 1.1
        
        storage_cost = 45.0 if commodity.category == "Vegetable" else 18.0
        net_gain = last_forecast - current_price - storage_cost
        should_store = net_gain > 50.0 and commodity.shelfLifeDays > 60

        if should_store:
            advisory = "STORE"
            advisory_text = (
                f"AI Predictive models indicate a price rally to ₹{round(last_forecast)}/Qtl over the next 30 days. "
                f"Appreciation (+₹{round(last_forecast - current_price)}/q) outweighs carrying storage costs (₹{storage_cost}/q/mo). "
                f"Estimated net benefit: +₹{round(net_gain)}/Qtl."
            )
            confidence = 89
        else:
            advisory = "SELL"
            advisory_text = (
                f"High APMC daily arrival volumes and crop perishability (~{commodity.shelfLifeDays} days shelf-life). "
                f"Selling spot now at nearest APMC locks in maximum profit with minimal post-harvest risk."
            )
            confidence = 92

        return ForecastResponse(
            cropId=commodity.id,
            cropName=commodity.name,
            currentAvgPrice=commodity.currentAvgPrice,
            points=points,
            decisionAdvisory=advisory,
            advisoryText=advisory_text,
            confidencePercent=confidence,
            estimatedGainPerQtl=round(net_gain, 2)
        )

ml_engine = MLEngine()
