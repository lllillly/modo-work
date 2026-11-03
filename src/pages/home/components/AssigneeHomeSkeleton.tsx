import { Card, Skeleton } from 'antd'

export default function AssigneeHomeSkeleton() {
  return (
    <div className="flex flex-col gap-md" aria-label="홈 불러오는 중" role="status" aria-busy="true">
      {[3, 4].map((rowCount) => (
        <Card
          key={rowCount}
          variant="borderless"
          className="shadow-none"
          classNames={{ body: 'px-md py-5 min-[992px]:px-lg' }}
        >
          <div aria-hidden="true">
            <Skeleton.Node active classNames={{ root: 'mb-md flex h-4', content: 'h-full w-[120px] rounded-sm' }} />
            <div className="flex flex-col gap-md">
              {Array.from({ length: rowCount }, (_, index) => (
                <div key={index} className="flex items-center gap-sm">
                  <Skeleton.Node active classNames={{ root: 'flex h-4 shrink-0', content: 'h-full w-4 rounded-sm' }} />
                  <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
                    <Skeleton.Node active classNames={{ root: 'flex h-3 w-full', content: 'h-full w-full rounded-sm' }} />
                    <Skeleton.Node active classNames={{ root: 'flex h-[10px] w-[180px] max-w-full', content: 'h-full w-full rounded-sm' }} />
                  </div>
                  <Skeleton.Node active classNames={{ root: 'flex h-[18px] shrink-0', content: 'h-full w-11 rounded-sm' }} />
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
