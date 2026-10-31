"""
Supervised Attrition ML Service bridge.
Connects AttritionModelService with the central AnalyticsService instance.
"""

from ml.attrition_model import AttritionModelService, validate_features_no_protected
from backend.app.services.analytics_service import analytics_service

attrition_model_service = AttritionModelService(analytics_service=analytics_service)
attrition_service = attrition_model_service
