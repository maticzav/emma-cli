/**
 * Fixed from @types/ink-text-input
 */
declare module 'ink-text-input' {
  import { Component } from 'react'

  interface TextInputProps {
    focus?: boolean
    onChange?: (value: string) => void
    onSubmit?: (value: string) => void
    placeholder?: string
    value?: string
  }

  declare class TextInput extends Component<TextInputProps> {}

  export = TextInput
}
