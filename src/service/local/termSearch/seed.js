/**
 * 표준용어 검색이 읽는 현재본.
 * 세션 저장소에 넣지 않는다. 검색은 이 값을 바꾸지 않는다.
 * 건수는 프로토타입용으로 작게 두되, 화면 확인 항목(아스피린, 숫자 코드, 임시컨셉, 패싯)은 넣는다.
 */

function concept(row) {
  return {
    conceptId: row.id,
    conceptCode: row.code,
    conceptName: row.name,
    conceptClassId: row.classId,
    standardConcept: row.standard,
    invalidReason: row.invalid,
    domainId: row.domain,
    vocabularyId: row.vocab,
    isLocal: row.local === true,
    validStartDate: row.start || '1970-01-01',
    validEndDate: row.end || '2099-12-31',
  };
}

const SPECIAL = [
  concept({ id: 1112807, code: '1191', name: 'aspirin', classId: 'Ingredient', standard: 'S', invalid: null, domain: 'Drug', vocab: 'RxNorm' }),
  concept({ id: 1200001, code: 'aspirin', name: 'Aspirin code token', classId: 'Ingredient', standard: 'S', invalid: null, domain: 'Drug', vocab: 'RxNorm' }),
  concept({ id: 19019073, code: '197361', name: 'Aspirin 325 MG Oral Tablet', classId: 'Clinical Drug', standard: 'S', invalid: null, domain: 'Drug', vocab: 'RxNorm' }),
  concept({ id: 19019074, code: '1112807', name: 'Numeric code echo', classId: 'Ingredient', standard: 'S', invalid: null, domain: 'Drug', vocab: 'RxNorm' }),
  concept({ id: 440001, code: 'ASA', name: 'acetylsalicylic acid', classId: 'Ingredient', standard: 'S', invalid: null, domain: 'Drug', vocab: 'RxNorm' }),
  concept({ id: 990001, code: 'L-ASP', name: 'aspirin local draft', classId: 'Ingredient', standard: 'S', invalid: null, domain: 'Drug', vocab: 'RxNorm', local: true, start: '2026-01-01' }),
  concept({ id: 500100, code: 'T2DM', name: 'Type-2 diabetes mellitus', classId: 'Disorder', standard: 'S', invalid: null, domain: 'Condition', vocab: 'SNOMED', start: '2006-05-12' }),
];

const FILLER = [
  ['2001', '21522001', 'Abdominal pain', 'Disorder', 'S', null, 'Condition', 'SNOMED'],
  ['2002', '32398004', 'Acute bronchitis', 'Disorder', 'S', null, 'Condition', 'SNOMED'],
  ['2003', '80146002', 'Appendectomy', 'Procedure', 'S', null, 'Procedure', 'SNOMED'],
  ['2004', '8480-6', 'Blood pressure', 'Clinical Finding', 'C', null, 'Measurement', 'LOINC'],
  ['2005', '39156-5', 'Body mass index', 'Clinical Finding', 'S', null, 'Measurement', 'LOINC'],
  ['2006', '29857009', 'Chest pain', 'Disorder', 'S', 'D', 'Condition', 'SNOMED'],
  ['2007', '58410-2', 'Complete blood count', 'Lab Test', 'S', null, 'Measurement', 'LOINC'],
  ['2008', '73211009', 'Diabetes mellitus', 'Disorder', 'S', null, 'Condition', 'SNOMED'],
  ['2009', '29303009', 'Electrocardiogram', 'Procedure', 'S', null, 'Procedure', 'SNOMED'],
  ['2010', '59621000', 'Essential hypertension', 'Disorder', 'S', null, 'Condition', 'SNOMED'],
  ['2011', '2345-7', 'Glucose', 'Lab Test', 'C', null, 'Measurement', 'LOINC'],
  ['2012', '25064002', 'Headache', 'Disorder', null, null, 'Condition', 'SNOMED'],
  ['2013', '4548-4', 'Hemoglobin A1c', 'Lab Test', 'S', null, 'Measurement', 'LOINC'],
  ['2014', '5640', 'Ibuprofen', 'Ingredient', 'S', null, 'Drug', 'RxNorm'],
  ['2015', '6142004', 'Influenza', 'Disorder', 'S', null, 'Condition', 'SNOMED'],
  ['2016', '179344006', 'Knee replacement', 'Procedure', 'S', null, 'Procedure', 'SNOMED'],
  ['2017', '6809', 'Metformin', 'Ingredient', 'S', null, 'Drug', 'RxNorm'],
  ['2018', '37796009', 'Migraine', 'Disorder', 'S', null, 'Condition', 'SNOMED'],
  ['2019', '414916001', 'Obesity', 'Disorder', 'C', null, 'Condition', 'SNOMED'],
  ['2020', '317541', 'Oral tablet', 'Dose Form', 'C', null, 'Drug', 'RxNorm'],
  ['2021', '161', 'Paracetamol', 'Ingredient', 'S', null, 'Drug', 'RxNorm'],
  ['2022', '233604007', 'Pneumonia', 'Disorder', 'S', null, 'Condition', 'SNOMED'],
  ['2023', '2160-0', 'Serum creatinine', 'Lab Test', 'S', 'U', 'Measurement', 'LOINC'],
  ['2024', '77176002', 'Smoking status', 'Observable', null, null, 'Obs', 'SNOMED'],
  ['2026', '24357-6', 'Urinalysis', 'Lab Test', 'S', null, 'Measurement', 'LOINC'],
  ['2027', '34014006', 'Viral infection', 'Disorder', 'S', null, 'Condition', 'SNOMED'],
  ['2028', '11289', 'Warfarin', 'Ingredient', 'S', null, 'Drug', 'RxNorm'],
  ['2029', '399208008', 'X-ray of chest', 'Procedure', 'S', null, 'Procedure', 'SNOMED'],
  ['2030', '1111646', 'Yellow fever vaccine', 'Clinical Drug', 'S', null, 'Drug', 'RxNorm'],
].map((row) => concept({
  id: Number(row[0]),
  code: row[1],
  name: row[2],
  classId: row[3],
  standard: row[4],
  invalid: row[5],
  domain: row[6],
  vocab: row[7],
}));

export const VOCAB = {
  versions: [{ versionLabel: 'v20250827', status: 'ACTIVE' }],
  domains: [
    { domainId: 'Drug', domainName: 'Drug' },
    { domainId: 'Condition', domainName: 'Condition' },
    { domainId: 'Procedure', domainName: 'Procedure' },
    { domainId: 'Measurement', domainName: 'Measurement' },
  ],
  concepts: SPECIAL.concat(FILLER),
  synonyms: [
    { conceptId: 1112807, conceptSynonymName: 'acetylsalicylic acid', languageConceptId: 4180186 },
    { conceptId: 1112807, conceptSynonymName: 'ASA', languageConceptId: 4180186 },
    { conceptId: 440001, conceptSynonymName: 'aspirin', languageConceptId: 4180186 },
    { conceptId: 500100, conceptSynonymName: 'type-2 diabetes', languageConceptId: 4180186 },
  ],
  relationships: [
    { conceptId1: 1112807, conceptId2: 19019073, relationshipId: 'RxNorm ing of', invalidReason: null },
    { conceptId1: 1112807, conceptId2: 440001, relationshipId: 'Maps to', invalidReason: null },
    { conceptId1: 1112807, conceptId2: 19019074, relationshipId: 'Maps to', invalidReason: 'D' },
    { conceptId1: 440001, conceptId2: 1112807, relationshipId: 'Maps to', invalidReason: null },
  ],
  languages: [
    { conceptId: 4180186, conceptName: 'English' },
  ],
  relationshipCatalog: [
    { relationshipId: 'Maps to', relationshipName: 'Non-standard to Standard map (OMOP)' },
    { relationshipId: 'RxNorm ing of', relationshipName: 'Ingredient of (RxNorm)' },
  ],
  vocabularies: [
    { vocabularyId: 'RxNorm', vocabularyName: 'RxNorm', vocabularyReference: 'https://www.nlm.nih.gov/research/umls/rxnorm/', vocabularyVersion: 'v20250827' },
    { vocabularyId: 'SNOMED', vocabularyName: 'SNOMED', vocabularyReference: 'https://www.snomed.org/', vocabularyVersion: 'v20250827' },
    { vocabularyId: 'LOINC', vocabularyName: 'LOINC', vocabularyReference: 'https://loinc.org/', vocabularyVersion: 'v20250827' },
  ],
};
