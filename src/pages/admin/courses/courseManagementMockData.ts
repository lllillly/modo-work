import type { CourseAssignee, CourseImportPreview, CourseImportRow, ManagedCourse } from '../../../types/adminCourses'

export const courseOrgUnits = [
  { id: 'org-1', name: '조직 단위 1', isClosed: false },
  { id: 'org-2', name: '조직 단위 2', isClosed: false },
  { id: 'org-3', name: '조직 단위 3', isClosed: true },
]

export const courseAreas = [
  { id: 'area-1', name: '영역 1' },
  { id: 'area-2', name: '영역 2' },
  { id: 'area-3', name: '영역 3' },
]

export const courseAssignees: CourseAssignee[] = [
  { id: 'user-a', name: '담당자 A', email: 'a@example.com', orgUnitId: 'org-1', areaIds: ['area-1'], status: 'ACTIVE' },
  {
    id: 'user-b',
    name: '담당자 B',
    email: 'b@example.com',
    orgUnitId: 'org-1',
    areaIds: ['area-2'],
    status: 'INACTIVE',
  },
  {
    id: 'user-c',
    name: '담당자 C',
    email: 'c@example.com',
    orgUnitId: 'org-1',
    areaIds: ['area-2', 'area-3'],
    status: 'ACTIVE',
  },
  {
    id: 'user-e',
    name: '담당자 E',
    email: 'e@example.com',
    orgUnitId: 'org-1',
    areaIds: ['area-1', 'area-3'],
    status: 'ACTIVE',
  },
  { id: 'user-f', name: '담당자 F', email: 'f@example.com', orgUnitId: 'org-1', areaIds: ['area-3'], status: 'ACTIVE' },
  { id: 'user-g', name: '담당자 G', email: 'g@example.com', orgUnitId: 'org-1', areaIds: ['area-3'], status: 'ACTIVE' },
  { id: 'user-h', name: '담당자 H', email: 'h@example.com', orgUnitId: 'org-2', areaIds: ['area-1'], status: 'ACTIVE' },
  { id: 'user-i', name: '담당자 I', email: 'i@example.com', orgUnitId: 'org-2', areaIds: ['area-2'], status: 'ACTIVE' },
  { id: 'user-j', name: '담당자 J', email: 'j@example.com', orgUnitId: 'org-2', areaIds: ['area-3'], status: 'ACTIVE' },
]

export const courseImportRules = [
  '외부 키가 이 사업에 이미 있으면 그 과정을 새 내용으로 갱신해요.',
  '외부 키를 다른 사업에서 쓰고 있으면 오류예요.',
  '장기·단기는 기간(시작·종료일 포함 180일 기준)으로 다시 계산해요. 파일의 length_type 값은 쓰지 않아요.',
  '오류가 1건이라도 있으면 전체를 등록하지 않아요. 파일을 고친 뒤 다시 올려 주세요.',
  '시스템에 없는 담당자 이메일은 오류가 아니라 경고예요. 그 영역은 미배정으로 등록돼요.',
  '파일에 없는 기존 과정은 지우지 않고 그대로 둬요.',
]

export const courseSaveSummaryMock = { created: 3, changed: 5, shifted: 1, reassigned: 4 }
export const courseSaveErrorMock = { field: 'externalKey', message: '다른 사업에서 이미 쓰는 외부 키예요' } as const

const courseImportRowsMock: CourseImportRow[] = [
  {
    line: 2,
    action: '신규',
    externalKey: 'LS-2026-040',
    name: '예시 과정 F 1회차',
    orgUnitName: '조직 단위 1',
    startDate: '2027-01-05',
    endDate: '2027-07-30',
    lengthLabel: '장기',
    capacity: 30,
    severity: null,
    message: '-',
  },
  {
    line: 3,
    action: '갱신',
    externalKey: 'LS-2026-031',
    name: '예시 과정 A 3회차',
    orgUnitName: '조직 단위 1',
    startDate: '2026-11-30',
    endDate: '2027-06-11',
    lengthLabel: '장기',
    capacity: 30,
    severity: null,
    message: '기존 과정의 종료일이 바뀌어요',
  },
  {
    line: 4,
    action: '신규',
    externalKey: 'LS-2026-041',
    name: '예시 과정 H 1회차',
    orgUnitName: '조직 단위 2',
    startDate: '2027-02-02',
    endDate: '2027-04-24',
    lengthLabel: '단기',
    capacity: 20,
    severity: 'warning',
    message: '시스템에 없는 담당자 이메일 (x@example.com) · 영역 2는 미배정으로 등록돼요',
  },
  {
    line: 5,
    action: '신규',
    externalKey: 'LS-2026-043',
    name: '예시 과정 J 1회차',
    orgUnitName: '조직 단위 1',
    startDate: '2027-03-02',
    endDate: '2027-05-29',
    lengthLabel: '단기',
    capacity: 30,
    severity: null,
    message: '-',
  },
]

const courseImportErrorsMock: CourseImportRow[] = [
  {
    line: 4,
    action: '오류',
    externalKey: 'LS-2025-112',
    name: '예시 과정 G 2회차',
    orgUnitName: '조직 단위 2',
    startDate: '2027-01-12',
    endDate: '2027-03-31',
    lengthLabel: '단기',
    capacity: 20,
    severity: 'error',
    message: '다른 사업에서 이미 쓰는 외부 키예요',
  },
  {
    line: 6,
    action: '오류',
    externalKey: 'LS-2026-042',
    name: '예시 과정 I 1회차',
    orgUnitName: '조직 단위 3',
    startDate: '2027-03-10',
    endDate: '2027-02-28',
    lengthLabel: '단기',
    capacity: 25,
    severity: 'error',
    message: '조직 단위를 찾을 수 없어요 · 종료일이 시작일보다 빨라요',
  },
  {
    line: 8,
    action: '오류',
    externalKey: 'LS-2026-009',
    name: '예시 과정 D 1회차',
    orgUnitName: '조직 단위 1',
    startDate: '2026-06-02',
    endDate: '2026-12-31',
    lengthLabel: '장기',
    capacity: 20,
    severity: 'error',
    message: '종료된 과정은 파일로 바꿀 수 없어요. 과정 화면에서 관리자가 정정해 주세요',
  },
]

// 실제 파일 검사 결과가 아닌 S10-3 화면 확인용 응답입니다.
export function getCourseImportPreviewMock(hasErrors: boolean, businessName: string): CourseImportPreview {
  if (businessName === '사업 2') {
    return {
      rows: hasErrors
        ? [courseImportErrorsMock[1]]
        : [
            {
              ...courseImportRowsMock[1],
              externalKey: 'LS-2025-112',
              name: '예시 과정 G 2회차',
              orgUnitName: '조직 단위 2',
              startDate: '2026-09-01',
              endDate: '2027-03-31',
            },
          ],
      createdCount: 0,
      updatedCount: hasErrors ? 0 : 1,
      warningCount: 0,
      errorCount: hasErrors ? 1 : 0,
      canImport: !hasErrors,
    }
  }
  const rows = hasErrors
    ? [
        courseImportRowsMock[0],
        courseImportRowsMock[1],
        courseImportErrorsMock[0],
        courseImportRowsMock[2],
        courseImportErrorsMock[1],
        courseImportRowsMock[3],
        courseImportErrorsMock[2],
      ]
    : courseImportRowsMock

  return {
    rows: rows.map((row, index) => ({ ...row, line: index + 2 })),
    createdCount: 3,
    updatedCount: 1,
    warningCount: 1,
    errorCount: hasErrors ? 3 : 0,
    canImport: !hasErrors,
  }
}

export function createCourseManagementMockData(): ManagedCourse[] {
  const make = (id: string, values: Partial<ManagedCourse>): ManagedCourse => ({
    id,
    businessName: '사업 1',
    externalKey: '',
    name: '',
    orgUnitId: 'org-1',
    startDate: '2026-09-01',
    endDate: '2026-12-19',
    capacity: 30,
    assignees: { 'area-1': ['user-a'], 'area-2': ['user-c'], 'area-3': ['user-e'] },
    version: 0,
    updatedAt: '2026-11-03T09:00:00+09:00',
    updatedBy: '관리자 A',
    archivedAt: null,
    archivedBy: null,
    hasProcessingHistory: false,
    pendingByArea: { 'area-1': 2, 'area-2': 2, 'area-3': 1 },
    history: [],
    ...values,
  })

  return [
    make('managed-a', {
      externalKey: 'LS-2026-031',
      name: '예시 과정 A 3회차',
      startDate: '2026-11-30',
      endDate: '2027-05-28',
    }),
    make('managed-b', {
      externalKey: 'LS-2026-018',
      name: '예시 과정 B 1회차',
      capacity: 25,
      hasProcessingHistory: true,
      assignees: { 'area-1': ['user-a', 'user-e'], 'area-2': ['user-b'], 'area-3': ['user-c'] },
    }),
    make('managed-c', {
      externalKey: 'LS-2026-022',
      name: '예시 과정 C 2회차',
      orgUnitId: 'org-2',
      startDate: '2026-10-13',
      endDate: '2027-04-30',
      capacity: 40,
      assignees: { 'area-1': ['user-h'], 'area-2': [], 'area-3': ['user-j'] },
    }),
    make('managed-e', {
      externalKey: 'LS-2026-027',
      name: '예시 과정 E 1회차',
      orgUnitId: 'org-2',
      startDate: '2026-10-20',
      endDate: '2026-12-18',
      capacity: 20,
      hasProcessingHistory: true,
      assignees: { 'area-1': ['user-h'], 'area-2': ['user-i'], 'area-3': ['user-j'] },
    }),
    make('managed-d', {
      externalKey: 'LS-2026-009',
      name: '예시 과정 D 1회차',
      startDate: '2026-06-02',
      endDate: '2026-10-31',
      capacity: 20,
      hasProcessingHistory: true,
      assignees: { 'area-1': ['user-a'], 'area-2': ['user-b'], 'area-3': ['user-e'] },
    }),
    make('managed-k', {
      externalKey: 'LS-2026-005',
      name: '예시 과정 K 1회차',
      startDate: '2026-03-03',
      endDate: '2026-06-26',
      hasProcessingHistory: true,
      archivedAt: '2026-10-30T09:00:00+09:00',
      archivedBy: '관리자 A',
    }),
    make('managed-l', {
      externalKey: 'LS-2025-118',
      name: '예시 과정 L 2회차',
      orgUnitId: 'org-2',
      startDate: '2026-01-06',
      endDate: '2026-07-31',
      hasProcessingHistory: true,
      archivedAt: '2026-09-12T09:00:00+09:00',
      archivedBy: '관리자 B',
      assignees: { 'area-1': ['user-h'], 'area-2': ['user-i'], 'area-3': ['user-j'] },
    }),
    make('managed-other', {
      businessName: '사업 2',
      externalKey: 'LS-2025-112',
      name: '예시 과정 G 2회차',
      orgUnitId: 'org-2',
      assignees: { 'area-1': ['user-h'], 'area-2': ['user-i'], 'area-3': ['user-j'] },
    }),
  ]
}
