import { SearchOutlined } from '@ant-design/icons'
import { Input } from 'antd'
import type { InputProps } from 'antd'

type SearchInputProps = Omit<InputProps, 'prefix' | 'variant'> & {
  label: string
  onPage?: boolean
}

export default function SearchInput({ label, onPage = false, className = '', ...props }: SearchInputProps) {
  return (
    <Input
      aria-label={label}
      placeholder={label}
      allowClear
      {...props}
      variant="filled"
      prefix={<SearchOutlined aria-hidden className="mr-xxs text-(--ant-color-text-secondary)" />}
      className={`rounded-lg ${onPage ? 'bg-(--ant-color-bg-container)' : ''} ${className}`}
    />
  )
}
