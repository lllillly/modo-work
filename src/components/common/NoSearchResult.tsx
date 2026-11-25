import type { ReactNode } from 'react'
import { SearchOutlined } from '@ant-design/icons'

import EmptyData from './EmptyData'

type NoSearchResultProps = {
  title: string
  description?: ReactNode
  action?: ReactNode
  plain?: boolean
  compact?: boolean
}

export default function NoSearchResult({ title, description = '검색어나 필터를 바꿔 보세요.', ...rest }: NoSearchResultProps) {
  return (
    <EmptyData
      {...rest}
      title={title}
      description={description}
      icon={<SearchOutlined aria-hidden className={`${rest.compact ? 'text-3xl' : 'text-4xl'} text-(--ant-color-text-tertiary)`} />}
    />
  )
}
