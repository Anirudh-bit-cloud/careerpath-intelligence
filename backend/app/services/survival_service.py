"""
Survival Analysis and Model Validation Compatibility Layer.
Re-exports from backend.app.services.validation_service for full backward compatibility.
"""

from backend.app.services.validation_service import ValidationService, SurvivalValidationService

__all__ = ["ValidationService", "SurvivalValidationService"]
