'use client'

import { Label, TextInput } from 'flowbite-react'

export function Capture() {
  return (
    <div className='flex max-w-md flex-col gap-4'>
      <Label htmlFor='disabledInput1'>API token</Label>
      <TextInput type='text' id='disabledInput1' placeholder='Disabled input' disabled />
      <Label htmlFor='disabledInput2'>Personal access token</Label>
      <TextInput type='text' id='disabledInput2' placeholder='Disabled readonly input' disabled readOnly />
    </div>
  )
}
