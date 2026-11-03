import type { Course, HomeCourse, HomeTask, Task, ViewScope } from '../../types/home'

type AssigneeHomeDataOpt = {
  businessName: string
  courses: Course[]
  tasks: Task[]
  viewScope: ViewScope
  selectedDate: string
  today: string
}

export function getAssigneeHomeData({
  businessName,
  courses,
  tasks,
  viewScope,
  selectedDate,
  today,
}: AssigneeHomeDataOpt) {
  // 선택한 사업 과정
  const businessCourses = courses.filter((course) => course.businessName === businessName)
  const courseById = new Map(businessCourses.map((course) => [course.id, course]))
  const homeTasks: HomeTask[] = []

  // 할 일에 과정명 연결
  for (const task of tasks) {
    const course = courseById.get(task.courseId)
    if (course) homeTasks.push({ ...task, courseName: course.name })
  }

  // 내 영역 보기 / 전체 보기
  const myTasks = homeTasks.filter((task) => task.isMyArea)
  const progressTasks = viewScope === 'all' ? homeTasks : myTasks

  // 내 알림: 기한 지남 -> D-day -> 임박으로
  const alerts = myTasks
    .filter((task) => !task.isCompleted && (task.deadlineStatus === 'overdue' || task.deadlineStatus === 'dueSoon'))
    .sort((a, b) => {
      const aPriority = a.deadlineStatus === 'overdue' ? 0 : a.dueDate === today ? 1 : 2
      const bPriority = b.deadlineStatus === 'overdue' ? 0 : b.dueDate === today ? 1 : 2
      return aPriority - bPriority || (a.dueDate ?? '').localeCompare(b.dueDate ?? '')
    })

  // 과정별 진행률에 사용할 완료 건수 및 전체 건수
  const homeCourses: HomeCourse[] = businessCourses.map((course) => {
    const taskList = progressTasks.filter((task) => task.courseId === course.id)
    return {
      ...course,
      completedCount: taskList.filter((task) => task.isCompleted).length,
      totalCount: taskList.length,
    }
  })

  return {
    courses: homeCourses,
    myTasks,
    alerts,

    // 선택한 날짜의 내 할 일 미완료 먼저
    dayTasks: myTasks
      .filter((task) => task.dueDate === selectedDate)
      .sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted)),

    // 전체 보기에서만 다른 영역 표시
    otherTasks: viewScope === 'all'
      ? homeTasks.filter((task) => !task.isMyArea && task.dueDate === selectedDate)
      : [],
    calendarTasks: progressTasks,

    // 내 알림 요약 개수
    overdueCount: alerts.filter((task) => task.deadlineStatus === 'overdue').length,
    dueSoonCount: alerts.filter((task) => task.deadlineStatus === 'dueSoon').length,
    todayCount: myTasks.filter((task) => !task.isCompleted && task.dueDate === today).length,
  }
}
