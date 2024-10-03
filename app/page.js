'use client'
import PropertyForm from '@/components/PropertyForm'
import React, { useState } from 'react'

export default function Page() {
  const [clientName, setClientName] = useState('')
  const [propertyName, setPropertyName] = useState('')
  const [address, setAddress] = useState('')
  // Initialize inputFields with an array of objects, each with a 'value' property
  const [areaFields, setAreaFields] = useState([{ value: '' }])

  // Function to add new input field
  const addInputField = () => {
    setAreaFields([...areaFields, { value: '' }])
  }
  const [areas, setAreas] = useState([{ name: '', images: [] }])

  // Function to handle input change
  const handleInputChange = (index, event) => {
    const values = [...inputFields]
    values[index].value = event.target.value // Update the value at the given index
    setAreaFields(values) // Set the new state
  }
  return (
    <div>
      <PropertyForm />
    </div>
  )
}
