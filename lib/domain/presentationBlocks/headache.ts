import type { DiagnosisDefinition } from "../../types";

export const headacheFeatureVocabulary = {
  painPattern: [
    "headache",
    "severe_headache",
    "thunderclap",
    "worst_headache_of_life",
    "sudden_onset",
    "gradual_onset",
    "unilateral_headache",
    "bilateral_headache",
    "temporal_headache",
    "occipital_headache",
    "frontal_headache",
    "retro_orbital_headache",
    "throbbing_headache",
    "pulsatile_headache",
    "pressure_headache",
    "band_like_headache",
    "neck_pain",
  ],
  associatedSymptoms: [
    "photophobia",
    "phonophobia",
    "nausea",
    "vomiting",
    "visual_aura",
    "aura",
    "visual_disturbance",
    "blurred_vision",
    "diplopia",
    "transient_visual_loss",
    "seizure",
    "confusion",
    "collapse",
  ],
  neurology: [
    "focal_neurology",
    "focal_weakness",
    "sensory_loss",
    "aphasia",
    "ataxia",
    "dysarthria",
    "cranial_nerve_deficit",
    "reduced_consciousness",
  ],
  meningism: [
    "neck_stiffness",
    "fever",
    "rash",
    "photophobia",
    "reduced_consciousness",
  ],
  giantCellArteritis: [
    "scalp_tenderness",
    "jaw_claudication",
    "visual_loss",
    "transient_visual_loss",
    "temporal_tenderness",
    "temporal_headache",
    "pmr_like_symptoms",
    "age_over_50",
    "older_age",
  ],
  raisedIntracranialPressure: [
    "worse_on_waking",
    "worse_lying_flat",
    "worse_with_coughing",
    "papilloedema",
    "vomiting",
    "visual_disturbance",
  ],
  cluster: [
    "lacrimation",
    "rhinorrhoea",
    "red_eye",
    "agitation",
    "retro_orbital_headache",
    "unilateral_headache",
  ],
  riskFactors: [
    "anticoagulation",
    "immunosuppression",
    "pregnancy_possible",
    "postpartum",
    "cancer",
    "hypertension",
    "older_age",
  ],
} as const;

export const headacheDiagnoses: DiagnosisDefinition[] = [
  {
    id: "subarachnoid_haemorrhage",
    name: "Subarachnoid haemorrhage",
    presentationBlocks: ["headache"],
    summary: "Thunderclap or worst-ever headache, especially with vomiting, meningism, collapse, seizure, or focal neurology.",
    features: {
      core: ["headache", "thunderclap"],
      discriminating: ["worst_headache_of_life", "sudden_onset", "collapse", "neck_stiffness", "seizure"],
      weak: ["vomiting", "photophobia"],
      against: ["recurrent_headache", "well_intervals", "gradual_onset"],
      riskFactors: ["hypertension"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["headache"],
          ifAny: ["thunderclap", "worst_headache_of_life"],
          add: 8,
          reason: "thunderclap or worst-ever headache is a high-risk SAH pattern",
        },
        {
          ifAll: ["headache", "sudden_onset"],
          ifAny: ["vomiting", "neck_stiffness", "collapse", "seizure", "focal_neurology"],
          add: 5,
          reason: "sudden headache with neurological or meningeal features supports SAH",
        },
      ],
      penalties: [
        {
          ifAll: ["gradual_onset", "recurrent_headache", "well_intervals"],
          subtract: 5,
          reason: "recurrent gradual headaches with well intervals argue against SAH",
        },
      ],
    },
    relationships: {
      commonMimics: ["Migraine", "Meningitis / encephalitis", "Raised intracranial pressure / intracranial mass"],
      patternTags: ["thunderclap-headache", "vascular-neurology"],
      redFlagTags: ["thunderclap", "sah"],
    },
    teaching: {
      keyPearls: ["A thunderclap headache should stay dangerous until SAH has been actively excluded."],
      classicPitfalls: ["Calling a first worst-ever headache migraine because nausea or photophobia are present."],
    },
    sourceNotes: ["NICE headache guidance and suspected neurological conditions guidance mapped in guideline registry."],
  },
  {
    id: "migraine",
    name: "Migraine",
    presentationBlocks: ["headache"],
    summary: "Recurrent unilateral throbbing headache with photophobia, nausea/vomiting, aura, and recovery between attacks.",
    features: {
      core: ["headache"],
      discriminating: ["photophobia", "visual_aura", "aura", "throbbing_headache", "unilateral_headache"],
      weak: ["nausea", "vomiting", "phonophobia", "recurrent_headache", "well_intervals"],
      against: ["thunderclap", "neck_stiffness", "fever", "focal_neurology", "reduced_consciousness"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["headache", "recurrent_headache"],
          ifAny: ["photophobia", "visual_aura", "throbbing_headache", "unilateral_headache"],
          add: 6,
          reason: "recurrent stereotyped headache with migrainous features supports migraine",
        },
        {
          ifAll: ["headache", "well_intervals"],
          ifAny: ["visual_aura", "photophobia", "phonophobia"],
          add: 4,
          reason: "well intervals plus aura or sensory sensitivity supports a primary migraine pattern",
        },
      ],
      penalties: [
        {
          ifAny: ["thunderclap", "reduced_consciousness", "seizure"],
          subtract: 6,
          reason: "abrupt or impaired-consciousness features should not be absorbed into migraine",
        },
      ],
    },
    relationships: {
      commonMimics: ["Subarachnoid haemorrhage", "Tension headache", "Cerebral venous sinus thrombosis"],
      patternTags: ["primary-headache", "aura"],
    },
    teaching: {
      keyPearls: ["Migraine is more plausible when attacks are recurrent and stereotyped with full recovery."],
      classicPitfalls: ["Diagnosing migraine for a first thunderclap or focal-neurology presentation."],
    },
    sourceNotes: ["Primary headache comparator mapped to NICE headache guidance."],
  },
  {
    id: "tension_headache",
    name: "Tension headache",
    presentationBlocks: ["headache"],
    summary: "Gradual bilateral pressure or band-like headache, often stress or sleep related, without dangerous neurological features.",
    features: {
      core: ["headache", "gradual_onset"],
      discriminating: ["bilateral_headache", "band_like_headache", "pressure_headache"],
      weak: ["stress_trigger", "poor_sleep", "neck_pain"],
      against: ["thunderclap", "vomiting", "photophobia", "focal_neurology", "fever", "neck_stiffness"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["headache", "gradual_onset"],
          ifAny: ["bilateral_headache", "band_like_headache", "pressure_headache"],
          add: 6,
          reason: "gradual bilateral band-like or pressure headache supports tension-type headache",
        },
      ],
      penalties: [
        {
          ifAny: ["thunderclap", "focal_neurology", "fever", "neck_stiffness"],
          subtract: 6,
          reason: "red-flag neurological or infectious features argue against tension headache",
        },
      ],
    },
    relationships: {
      commonMimics: ["Migraine", "Raised intracranial pressure / intracranial mass"],
      patternTags: ["primary-headache", "benign-comparator"],
    },
    teaching: {
      keyPearls: ["Tension-type headache should be a diagnosis of pattern fit after red flags are absent."],
      classicPitfalls: ["Over-reassuring a new severe headache because it is bilateral."],
    },
    sourceNotes: ["Primary headache comparator mapped to NICE headache guidance."],
  },
  {
    id: "cluster_headache",
    name: "Cluster headache",
    presentationBlocks: ["headache"],
    summary: "Severe unilateral orbital or temporal headache with ipsilateral autonomic features and agitation.",
    features: {
      core: ["headache", "unilateral_headache"],
      discriminating: ["retro_orbital_headache", "lacrimation", "rhinorrhoea", "red_eye", "agitation"],
      weak: ["severe_headache", "recurrent_headache"],
      against: ["fever", "neck_stiffness", "focal_neurology", "thunderclap"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["headache", "unilateral_headache"],
          ifAny: ["lacrimation", "rhinorrhoea", "red_eye", "agitation"],
          add: 7,
          reason: "unilateral headache with autonomic features supports cluster headache",
        },
      ],
    },
    relationships: {
      commonMimics: ["Migraine", "Subarachnoid haemorrhage"],
      patternTags: ["primary-headache", "autonomic-headache"],
    },
    teaching: {
      keyPearls: ["Autonomic features and agitation help separate cluster headache from migraine."],
      classicPitfalls: ["Missing red flags in a first severe unilateral headache."],
    },
    sourceNotes: ["Primary headache comparator mapped to NICE headache guidance."],
  },
  {
    id: "meningitis_encephalitis",
    name: "Meningitis / encephalitis",
    presentationBlocks: ["headache"],
    summary: "Headache with fever, neck stiffness, photophobia, rash, confusion, seizure, or reduced consciousness.",
    features: {
      core: ["headache", "fever"],
      discriminating: ["neck_stiffness", "photophobia", "rash", "confusion", "reduced_consciousness", "seizure"],
      weak: ["vomiting", "recent_infection", "shared_accommodation"],
      against: ["recurrent_headache", "well_intervals"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["headache", "fever"],
          ifAny: ["neck_stiffness", "photophobia", "rash", "confusion", "reduced_consciousness"],
          add: 8,
          reason: "headache with fever and meningitic or encephalitic features supports CNS infection",
        },
        {
          ifAll: ["headache"],
          ifAny: ["neck_stiffness", "rash", "reduced_consciousness"],
          add: 5,
          reason: "meningism, rash, or reduced consciousness makes CNS infection urgent",
        },
      ],
    },
    relationships: {
      commonMimics: ["Subarachnoid haemorrhage", "Migraine", "Viral illness"],
      patternTags: ["cns-infection"],
      redFlagTags: ["meningitis", "encephalitis"],
    },
    teaching: {
      keyPearls: ["Fever with neck stiffness, photophobia, rash, or altered consciousness should escalate CNS infection."],
      classicPitfalls: ["Reassuring headache plus photophobia as migraine when fever or confusion is present."],
    },
    sourceNotes: ["Mapped to NICE meningitis guidance and internal pilot coverage metadata."],
  },
  {
    id: "temporal_arteritis",
    name: "Temporal arteritis",
    presentationBlocks: ["headache"],
    summary: "Giant cell arteritis pattern: new headache in an older adult with jaw claudication, scalp/temporal tenderness, PMR symptoms, or visual loss.",
    features: {
      core: ["headache", "age_over_50"],
      discriminating: ["temporal_headache", "jaw_claudication", "scalp_tenderness", "temporal_tenderness", "visual_loss", "transient_visual_loss"],
      weak: ["pmr_like_symptoms", "blurred_vision", "visual_disturbance"],
      against: ["thunderclap", "well_intervals"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["age_over_50"],
          ifAny: ["jaw_claudication", "scalp_tenderness", "temporal_tenderness", "visual_loss", "transient_visual_loss"],
          add: 8,
          reason: "older adult with cranial or visual GCA features supports giant cell arteritis",
        },
        {
          ifAll: ["headache", "temporal_headache"],
          ifAny: ["jaw_claudication", "pmr_like_symptoms", "scalp_tenderness"],
          add: 5,
          reason: "temporal headache with jaw, scalp, or PMR features supports GCA",
        },
      ],
    },
    relationships: {
      commonMimics: ["Migraine", "Tension headache", "Raised intracranial pressure / intracranial mass"],
      patternTags: ["giant-cell-arteritis", "visual-risk"],
      redFlagTags: ["gca", "visual-loss"],
    },
    teaching: {
      keyPearls: ["GCA is a visual-risk headache diagnosis in older adults; jaw claudication is highly discriminating."],
      classicPitfalls: ["Calling a new older-adult temporal headache migraine without asking about jaw and visual symptoms."],
    },
    sourceNotes: ["Mapped to NICE CKS giant cell arteritis summary link."],
  },
  {
    id: "raised_intracranial_pressure_intracranial_mass",
    name: "Raised intracranial pressure / intracranial mass",
    presentationBlocks: ["headache"],
    summary: "Progressive headache worse on waking, lying flat, or coughing, with vomiting, papilloedema, visual symptoms, cancer, or immunosuppression.",
    features: {
      core: ["headache"],
      discriminating: ["worse_on_waking", "worse_lying_flat", "worse_with_coughing", "papilloedema"],
      weak: ["vomiting", "visual_disturbance", "blurred_vision", "diplopia"],
      against: ["well_intervals", "thunderclap"],
      riskFactors: ["cancer", "immunosuppression"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["headache"],
          ifAny: ["worse_on_waking", "worse_lying_flat", "worse_with_coughing", "papilloedema"],
          add: 7,
          reason: "positional, morning, cough-related headache or papilloedema supports raised ICP",
        },
        {
          ifAll: ["headache"],
          ifAny: ["cancer", "immunosuppression"],
          add: 3,
          reason: "cancer or immunosuppression increases concern for secondary intracranial pathology",
        },
      ],
    },
    relationships: {
      commonMimics: ["Migraine", "Tension headache", "Cerebral venous sinus thrombosis"],
      patternTags: ["secondary-headache", "raised-icp"],
      redFlagTags: ["raised-icp"],
    },
    teaching: {
      keyPearls: ["Morning, lying-flat, cough-related headache or papilloedema shifts the frame toward raised ICP."],
      classicPitfalls: ["Treating progressive positional headache as recurrent primary headache."],
    },
    sourceNotes: ["Mapped to NICE suspected neurological conditions guidance."],
  },
  {
    id: "cerebral_venous_sinus_thrombosis",
    name: "Cerebral venous sinus thrombosis",
    presentationBlocks: ["headache"],
    summary: "Headache with pregnancy/postpartum, thrombosis risk, papilloedema, seizure, focal neurology, or raised-ICP features.",
    features: {
      core: ["headache"],
      discriminating: ["seizure", "papilloedema", "focal_neurology", "visual_disturbance"],
      weak: ["worse_on_waking", "vomiting", "diplopia"],
      against: ["well_intervals"],
      riskFactors: ["pregnancy_possible", "postpartum", "anticoagulation", "cancer"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["headache"],
          ifAny: ["pregnancy_possible", "postpartum", "seizure", "papilloedema", "focal_neurology"],
          add: 6,
          reason: "headache with prothrombotic context, seizure, papilloedema, or focal neurology supports CVST",
        },
        {
          ifAll: ["headache"],
          ifAny: ["pregnancy_possible", "postpartum"],
          add: 3,
          reason: "pregnancy or postpartum context increases concern for CVST",
        },
        {
          ifAll: ["headache", "pregnancy_possible"],
          ifAny: ["vomiting", "visual_disturbance", "diplopia"],
          add: 4,
          reason: "pregnancy-related headache with raised-ICP features supports CVST",
        },
        {
          ifAll: ["headache", "postpartum"],
          ifAny: ["vomiting", "visual_disturbance", "diplopia", "papilloedema"],
          add: 4,
          reason: "postpartum headache with raised-ICP features supports CVST",
        },
      ],
    },
    relationships: {
      commonMimics: ["Migraine", "Raised intracranial pressure / intracranial mass", "Subarachnoid haemorrhage"],
      patternTags: ["secondary-headache", "venous-thrombosis"],
      redFlagTags: ["raised-icp", "focal-neurology"],
    },
    teaching: {
      keyPearls: ["Pregnancy/postpartum or thrombotic context with headache and neurological/raised-ICP features should raise CVST."],
      classicPitfalls: ["Mislabeling pregnancy-associated headache with visual symptoms as uncomplicated migraine."],
    },
    sourceNotes: ["Mapped to NICE suspected neurological conditions guidance as a secondary headache risk pattern."],
  },
  {
    id: "stroke_neurological_emergency",
    name: "Stroke / neurological emergency",
    presentationBlocks: ["headache"],
    summary: "Headache with new focal neurological deficit, aphasia, ataxia, dysarthria, cranial nerve deficit, visual loss, seizure, or collapse.",
    features: {
      core: ["headache"],
      discriminating: ["focal_neurology", "focal_weakness", "sensory_loss", "aphasia", "ataxia", "dysarthria", "cranial_nerve_deficit", "visual_loss"],
      weak: ["seizure", "confusion", "collapse"],
      against: ["well_intervals", "recurrent_headache"],
      riskFactors: ["hypertension", "age_over_50", "older_age"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["headache"],
          ifAny: ["focal_neurology", "focal_weakness", "aphasia", "ataxia", "dysarthria", "cranial_nerve_deficit", "visual_loss"],
          add: 8,
          reason: "headache with new focal neurological deficit supports neurological emergency",
        },
      ],
    },
    relationships: {
      commonMimics: ["Migraine", "Subarachnoid haemorrhage", "Cerebral venous sinus thrombosis"],
      patternTags: ["focal-neurology", "secondary-headache"],
      redFlagTags: ["focal-neurology"],
    },
    teaching: {
      keyPearls: ["New focal neurology changes headache from a primary-headache pattern to an emergency pattern."],
      classicPitfalls: ["Explaining focal deficits as migraine aura without checking onset, persistence, and vascular risk."],
    },
    sourceNotes: ["Mapped to NICE suspected neurological conditions guidance."],
  },
];

export const headacheDeferredSecondPass: string[] = [];
