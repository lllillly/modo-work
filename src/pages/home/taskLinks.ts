export function getCourseTasksPath(courseId: string, taskId?: string) {
  const query = new URLSearchParams({ courseId })
  if (taskId) query.set('taskId', taskId)
  return `/tasks?${query}`
}
