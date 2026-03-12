const FEATURE_LABELS: Record<string, string> = {
  chestPain: "chest pain",
  suddenOnset: "sudden onset",
  tearingPain: "tearing quality",
  backRadiation: "back radiation",
  collapse: "collapse / syncope",
  pulsatileAbdomen: "pulsatile abdomen",
  smoker: "smoking history",
  hypertension: "hypertension",
  abdominalPain: "abdominal pain",
  painOutOfProportion: "pain out of proportion",
  af: "atrial fibrillation",
  thunderclap: "thunderclap onset",
  headache: "headache",
  vomiting: "vomiting",
  neckStiffness: "neck stiffness",
  confusion: "confusion",
  focalNeurology: "focal neurology",
  sob: "shortness of breath",
  hypoxia: "hypoxia",
  pleuriticPain: "pleuritic pain",
  fever: "fever",
  hypotension: "hypotension / shock",
};

export function formatFeatureLabel(feature: string): string {
  return FEATURE_LABELS[feature] ?? feature;
}
