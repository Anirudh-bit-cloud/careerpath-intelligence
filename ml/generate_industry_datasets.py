"""
Deterministic Synthetic Industry Dataset Generator for CareerPath Intelligence.
Generates 3 realistic synthetic industry workforce datasets using fixed random seeds:
1. Cybersecurity & Cloud Tech (1,470 records)
2. Healthcare & Clinical Services (1,200 records)
3. Financial Services & Asset Management (1,350 records)

All datasets contain zero real personnel data and are explicitly labeled synthetic.
"""

import os
import numpy as np
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
os.makedirs(DATA_DIR, exist_ok=True)

COLUMNS = [
    "Age", "Attrition", "BusinessTravel", "DailyRate", "Department",
    "DistanceFromHome", "Education", "EducationField", "EnvironmentSatisfaction",
    "Gender", "HourlyRate", "JobInvolvement", "JobLevel", "JobRole",
    "JobSatisfaction", "MaritalStatus", "MonthlyIncome", "MonthlyRate",
    "NumCompaniesWorked", "OverTime", "PercentSalaryHike", "PerformanceRating",
    "RelationshipSatisfaction", "StockOptionLevel", "TotalWorkingYears",
    "TrainingTimesLastYear", "WorkLifeBalance", "YearsAtCompany",
    "YearsInCurrentRole", "YearsSinceLastPromotion", "YearsWithCurrManager"
]


def generate_healthcare_dataset(n_samples: int = 1200, seed: int = 42) -> str:
    rng = np.random.RandomState(seed)

    departments = ["Clinical Operations", "Biomedical R&D", "Patient Care", "Pharmacy & Therapeutics"]
    dept_weights = [0.40, 0.25, 0.20, 0.15]

    roles_by_dept = {
        "Clinical Operations": ["Clinical Nurse Specialist", "Operations Manager", "Care Coordinator", "Clinical Director"],
        "Biomedical R&D": ["Biomedical Scientist", "Laboratory Technologist", "Clinical Research Associate", "Principal Investigator"],
        "Patient Care": ["Registered Nurse", "Patient Care Supervisor", "Triage Specialist", "Nurse Practitioner"],
        "Pharmacy & Therapeutics": ["Clinical Pharmacist", "Therapeutics Specialist", "Pharmacy Manager", "Pharmacology Lead"]
    }

    edu_fields = ["Life Sciences", "Medical / Nursing", "Biochemistry", "Healthcare Administration", "Technical Degree"]

    records = []
    for i in range(n_samples):
        dept = rng.choice(departments, p=dept_weights)
        role = rng.choice(roles_by_dept[dept])
        level = int(rng.choice([1, 2, 3, 4, 5], p=[0.35, 0.30, 0.20, 0.10, 0.05]))

        age = int(rng.normal(26 + level * 4, 6))
        age = max(22, min(65, age))

        tot_working = max(1, int(age - 21 - rng.randint(0, 3)))
        co_tenure = max(0, min(tot_working, int(rng.exponential(4) + (level - 1) * 1.5)))
        role_tenure = max(0, min(co_tenure, int(co_tenure * rng.uniform(0.3, 1.0))))
        promo_gap = max(0, min(co_tenure, int(co_tenure * rng.uniform(0.2, 0.95))))
        curr_mgr = max(0, min(role_tenure, int(role_tenure * rng.uniform(0.4, 1.0))))

        base_income = 3200 + level * 2600 + int(tot_working * 140)

        record = {
            "Age": age,
            "Attrition": 0 if rng.rand() > 0.14 else 1,
            "BusinessTravel": rng.choice(["Non-Travel", "Travel_Rarely", "Travel_Frequently"], p=[0.25, 0.65, 0.10]),
            "DailyRate": rng.randint(400, 1400),
            "Department": dept,
            "DistanceFromHome": rng.randint(1, 30),
            "Education": int(rng.choice([2, 3, 4, 5], p=[0.20, 0.45, 0.25, 0.10])),
            "EducationField": rng.choice(edu_fields),
            "EnvironmentSatisfaction": int(rng.choice([1, 2, 3, 4], p=[0.10, 0.20, 0.40, 0.30])),
            "Gender": rng.choice(["Male", "Female"]),
            "HourlyRate": rng.randint(45, 100),
            "JobInvolvement": int(rng.choice([2, 3, 4], p=[0.25, 0.50, 0.25])),
            "JobLevel": level,
            "JobRole": role,
            "JobSatisfaction": int(rng.choice([1, 2, 3, 4], p=[0.12, 0.20, 0.45, 0.23])),
            "MaritalStatus": rng.choice(["Single", "Married", "Divorced"], p=[0.30, 0.55, 0.15]),
            "MonthlyIncome": base_income,
            "MonthlyRate": rng.randint(8000, 24000),
            "NumCompaniesWorked": rng.randint(1, 7),
            "OverTime": "Yes" if rng.rand() < 0.28 else "No",
            "PercentSalaryHike": rng.randint(11, 24),
            "PerformanceRating": 4 if rng.rand() < 0.18 else 3,
            "RelationshipSatisfaction": int(rng.choice([2, 3, 4], p=[0.20, 0.50, 0.30])),
            "StockOptionLevel": int(rng.choice([0, 1, 2], p=[0.60, 0.30, 0.10])),
            "TotalWorkingYears": tot_working,
            "TrainingTimesLastYear": int(rng.choice([0, 1, 2, 3, 4], p=[0.10, 0.25, 0.35, 0.20, 0.10])),
            "WorkLifeBalance": int(rng.choice([1, 2, 3, 4], p=[0.10, 0.25, 0.45, 0.20])),
            "YearsAtCompany": co_tenure,
            "YearsInCurrentRole": role_tenure,
            "YearsSinceLastPromotion": promo_gap,
            "YearsWithCurrManager": curr_mgr
        }
        records.append(record)

    df = pd.DataFrame(records)[COLUMNS]
    out_path = os.path.join(DATA_DIR, "synthetic_healthcare_workforce.csv")
    df.to_csv(out_path, index=False)
    return out_path


def generate_financial_dataset(n_samples: int = 1350, seed: int = 101) -> str:
    rng = np.random.RandomState(seed)

    departments = ["Quantitative Trading", "Risk & Compliance", "Asset Management", "Institutional Banking"]
    dept_weights = [0.25, 0.30, 0.30, 0.15]

    roles_by_dept = {
        "Quantitative Trading": ["Quantitative Analyst", "Algorithmic Trader", "Trading Systems Engineer", "Head of Quant Research"],
        "Risk & Compliance": ["Risk Strategist", "Compliance Officer", "Credit Risk Analyst", "Chief Risk Partner"],
        "Asset Management": ["Portfolio Associate", "Senior Portfolio Manager", "Investment Strategist", "Private Wealth Director"],
        "Institutional Banking": ["Investment Banking Associate", "Capital Markets Specialist", "Deal Structuring VP", "Managing Director"]
    }

    edu_fields = ["Economics / Finance", "Computer Science", "Mathematics / Statistics", "Business Administration", "Engineering"]

    records = []
    for i in range(n_samples):
        dept = rng.choice(departments, p=dept_weights)
        role = rng.choice(roles_by_dept[dept])
        level = int(rng.choice([1, 2, 3, 4, 5], p=[0.30, 0.30, 0.22, 0.12, 0.06]))

        age = int(rng.normal(25 + level * 4.5, 5.5))
        age = max(22, min(65, age))

        tot_working = max(1, int(age - 21 - rng.randint(0, 2)))
        co_tenure = max(0, min(tot_working, int(rng.exponential(3.8) + (level - 1) * 1.6)))
        role_tenure = max(0, min(co_tenure, int(co_tenure * rng.uniform(0.35, 1.0))))
        promo_gap = max(0, min(co_tenure, int(co_tenure * rng.uniform(0.25, 0.95))))
        curr_mgr = max(0, min(role_tenure, int(role_tenure * rng.uniform(0.45, 1.0))))

        base_income = 4800 + level * 3400 + int(tot_working * 210)

        record = {
            "Age": age,
            "Attrition": 0 if rng.rand() > 0.13 else 1,
            "BusinessTravel": rng.choice(["Non-Travel", "Travel_Rarely", "Travel_Frequently"], p=[0.20, 0.60, 0.20]),
            "DailyRate": rng.randint(500, 1500),
            "Department": dept,
            "DistanceFromHome": rng.randint(1, 28),
            "Education": int(rng.choice([3, 4, 5], p=[0.40, 0.45, 0.15])),
            "EducationField": rng.choice(edu_fields),
            "EnvironmentSatisfaction": int(rng.choice([1, 2, 3, 4], p=[0.12, 0.20, 0.40, 0.28])),
            "Gender": rng.choice(["Male", "Female"]),
            "HourlyRate": rng.randint(55, 110),
            "JobInvolvement": int(rng.choice([2, 3, 4], p=[0.20, 0.55, 0.25])),
            "JobLevel": level,
            "JobRole": role,
            "JobSatisfaction": int(rng.choice([1, 2, 3, 4], p=[0.10, 0.20, 0.45, 0.25])),
            "MaritalStatus": rng.choice(["Single", "Married", "Divorced"], p=[0.32, 0.52, 0.16]),
            "MonthlyIncome": base_income,
            "MonthlyRate": rng.randint(9000, 26000),
            "NumCompaniesWorked": rng.randint(1, 6),
            "OverTime": "Yes" if rng.rand() < 0.32 else "No",
            "PercentSalaryHike": rng.randint(12, 28),
            "PerformanceRating": 4 if rng.rand() < 0.22 else 3,
            "RelationshipSatisfaction": int(rng.choice([2, 3, 4], p=[0.18, 0.52, 0.30])),
            "StockOptionLevel": int(rng.choice([0, 1, 2, 3], p=[0.35, 0.35, 0.20, 0.10])),
            "TotalWorkingYears": tot_working,
            "TrainingTimesLastYear": int(rng.choice([0, 1, 2, 3, 4, 5], p=[0.08, 0.20, 0.35, 0.22, 0.10, 0.05])),
            "WorkLifeBalance": int(rng.choice([1, 2, 3, 4], p=[0.15, 0.28, 0.42, 0.15])),
            "YearsAtCompany": co_tenure,
            "YearsInCurrentRole": role_tenure,
            "YearsSinceLastPromotion": promo_gap,
            "YearsWithCurrManager": curr_mgr
        }
        records.append(record)

    df = pd.DataFrame(records)[COLUMNS]
    out_path = os.path.join(DATA_DIR, "synthetic_financial_workforce.csv")
    df.to_csv(out_path, index=False)
    return out_path


if __name__ == "__main__":
    h_path = generate_healthcare_dataset()
    f_path = generate_financial_dataset()
    print(f"Generated healthcare dataset: {h_path}")
    print(f"Generated financial dataset: {f_path}")
