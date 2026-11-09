import { Card, Skeleton } from 'antd'

export default function CourseTasksSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-md min-[992px]:grid-cols-[minmax(0,1fr)_320px] min-[1280px]:grid-cols-[minmax(0,1fr)_400px]" role="status" aria-label="과정별 할 일 불러오는 중">
      <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-lg' }}>
        <Skeleton active round paragraph={false} title={{ width: 200 }} classNames={{ title: 'm-0! h-5!' }} />
        <div className="mt-md flex flex-col gap-md">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex min-h-8 items-center gap-sm">
              <Skeleton.Avatar active shape="square" size={16} classNames={{ content: 'rounded-sm' }} />
              <Skeleton active title={false} paragraph={{ rows: 2, width: ['100%', '38%'] }} classNames={{ paragraph: 'm-0! [&>li]:h-3! [&>li+li]:mt-xxs!' }} />
              <Skeleton.Button active size="small" className="[&_.ant-skeleton-button]:h-4! [&_.ant-skeleton-button]:w-12!" />
            </div>
          ))}
        </div>
      </Card>
      <Card variant="borderless" className="self-start shadow-none" classNames={{ body: 'p-lg' }}>
        <Skeleton active title={{ width: 120 }} paragraph={{ rows: 5, width: '100%' }} classNames={{ title: 'm-0! h-4!', paragraph: 'mt-sm! mb-0! [&>li]:h-3.5! [&>li+li]:mt-sm!' }} />
      </Card>
    </div>
  )
}
