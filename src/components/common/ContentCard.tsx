import { Card } from 'antd'
import type { CardProps } from 'antd'

type ContentCardProps = Omit<CardProps, 'variant' | 'classNames'>

export default function ContentCard({ className = '', children, ...rest }: ContentCardProps) {
  return (
    <Card {...rest} variant="borderless" className={`shadow-none ${className}`.trim()} classNames={{ body: 'p-md min-[992px]:p-lg' }}>
      {children}
    </Card>
  )
}
