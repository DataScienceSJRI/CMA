const DEPARTMENT_GROUPS = [
  {
    institution: "SJMC",
    categories: [
      {
        label: "Preclinical Departments",
        departments: ["Anatomy", "Biochemistry", "Physiology"],
      },
      {
        label: "Paraclinical Departments",
        departments: ["Community Medicine", "Forensic Medicine", "Microbiology", "Pathology", "Pharmacology"],
      },
      {
        label: "Clinical Departments",
        departments: [
          "Anesthesiology", "Dental Surgery", "Dermatology", "Emergency Medicine",
          "Family Medicine", "General Medicine", "General Surgery",
          "Obstetrics & Gynaecology", "Ophthalmology", "Orthopaedics",
          "Otolaryngology (ENT)", "Paediatrics",
          "Physical Medicine & Rehabilitation (PMR)", "Psychiatry",
          "Radiology (Radiodiagnosis)", "Transfusion Medicine and Immunohematology",
        ],
      },
      {
        label: "Superspeciality Departments",
        departments: [
          "Cardiology", "Cardiothoracic and Vascular Surgery",
          "Clinical Immunology and Rheumatology", "Clinical Hematology",
          "Critical Care Medicine", "Endocrinology", "Gastroenterology",
          "Gynaecological Oncology", "Medical Oncology", "Neonatology",
          "Nephrology", "Neurology", "Neurosurgery",
          "Pain, Palliative Medicine and Supportive Care", "Pediatric Intensive Care",
          "Paediatric Nephrology", "Paediatric Surgery",
          "Pediatric Hematology and Oncology", "Plastic Surgery",
          "Pulmonary Medicine", "Radiation Oncology (Radiotherapy)",
          "Surgical Oncology", "Urology",
        ],
      },
      {
        label: "Ancillary Departments",
        departments: [
          "Biostatistics", "History of Medicine", "Medical Education",
          "Medical Ethics", "Students Portal",
        ],
      },
    ],
  },
  {
    institution: "SJRI",
    categories: [
      {
        label: "Divisions",
        departments: [
          "Clinical Research and Training",
          "Epidemiology, Biostatistics and Population Health",
          "Health and Humanities", "Infectious Diseases",
          "Medical Informatics", "Mental Health and Neurosciences",
          "Molecular Medicine", "Nutrition",
        ],
      },
    ],
  },
];

export const ALL_DEPARTMENTS: { dept: string; group: string }[] =
  DEPARTMENT_GROUPS.flatMap((inst) =>
    inst.categories.flatMap((cat) =>
      cat.departments.map((d) => ({ dept: d, group: `${inst.institution} — ${cat.label}` }))
    )
  );
