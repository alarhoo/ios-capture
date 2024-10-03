'use client'
import React, { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { FloatingLabel, FileInput, Label, Button, TextInput, Textarea, HR } from 'flowbite-react'
import Image from 'next/image'
import loaderGif from '@/components/loading.gif'
import Overlay from '@/components/Overlay'

const PropertyForm = () => {
  const [clientName, setClientName] = useState('')
  const [propertyName, setPropertyName] = useState('')
  const [address, setAddress] = useState('')
  const [bannerImage, setBannerImage] = useState('')
  const [bannerFile, setBannerFile] = useState('')
  const [sections, setSections] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [pdfData, setPdfData] = useState(null) // New state for storing PDF base64 data
  const [errors, setErrors] = useState({})
  const [deficiencies, setDeficiencies] = useState([])

  const handleBannerUpload = (e) => {
    const file = e.target.files[0]
    setBannerFile(file)
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setBannerImage(imageUrl)
    }
  }

  const addSection = () => {
    setSections([...sections, { name: '', images: [] }])
  }

  const updateAreaName = (index, name) => {
    const newSections = [...sections]
    newSections[index].name = name
    setSections(newSections)
  }

  const handleImageUpload = (index, files) => {
    const newSections = [...sections]
    const imagesArray = Array.from(files).map((file) => ({
      id: URL.createObjectURL(file),
      file,
    }))
    newSections[index].images.push(...imagesArray)
    setSections(newSections)
  }

  const removeImage = (sectionIndex, imageIndex) => {
    const newSections = [...sections]
    newSections[sectionIndex].images.splice(imageIndex, 1)
    setSections(newSections)
  }

  const generatePDF = async (action) => {
    try {
      setErrors({})

      if (!clientName || !propertyName || !address) {
        setErrors({
          clientName: !clientName ? 'error' : 'success',
          propertyName: !propertyName ? 'error' : 'success',
          address: !address ? 'error' : 'success',
        })
        return
      }

      setIsLoading(true)
      const doc = new jsPDF('p', 'mm', 'a4') // Create A4 PDF

      // Add client and property information on the first page
      const currentDate = new Date().toLocaleDateString()
      doc.setFontSize(14)
      doc.text(currentDate, 10, 10) // Date at the top

      // Set larger font size for the headers
      doc.setFontSize(30)
      doc.textAlign = 'center'
      const headerText = 'Onsite Inspection Report'
      const textWidth = doc.getTextWidth(headerText)
      doc.text(headerText, 105, 50, { align: 'center' })
      // Set the line color and width
      doc.setDrawColor(0) // Black color for the underline
      doc.setLineWidth(0.5) // Line width

      // Calculate the start and end x-coordinates for the underline
      const startX = 105 - textWidth / 2 // Center the underline horizontally
      const endX = 105 + textWidth / 2

      // Draw the underline slightly below the text (adjust y-coordinate)
      doc.line(startX, 52, endX, 52)

      doc.setFontSize(25)
      doc.text(clientName, 105, 80, { align: 'center' })
      doc.setFontSize(20)
      doc.text(propertyName, 105, 90, { align: 'center' })
      doc.setFontSize(15)
      doc.text(address, 105, 100, { align: 'center' })

      // Add banner image if it exists
      if (bannerImage) {
        if (bannerFile) {
          const bannerBase64 = await convertToBase64(bannerFile)
          const imgProps = doc.getImageProperties(bannerBase64)
          const pageWidth = 210
          const maxBannerHeight = 80
          const bannerWidth = pageWidth - 40
          const bannerHeight = (imgProps.height * bannerWidth) / imgProps.width

          const finalBannerHeight = bannerHeight > maxBannerHeight ? maxBannerHeight : bannerHeight
          doc.addImage(bannerBase64, 'JPEG', 20, 110, bannerWidth, finalBannerHeight)
        }
      }
      doc.addPage()

      // Calculate the center of the page
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // Move-In Report
      if (sections.length > 0) {
        doc.setFontSize(50)
        doc.text('Move-In Images', pageWidth / 2, pageHeight / 2, { align: 'center' })
        doc.addPage() // Add new page for area images
      }

      // Loop through sections to add area images
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i]

        let yPos = 20 // Start position for images on the next page
        // Add section header
        if (section.name) {
          if (yPos + 20 > 280) {
            // Check if there's space for the header
            doc.addPage()
            yPos = 20 // Reset y position on new page
          }
          doc.setFontSize(25)
          doc.text(section.name, 10, yPos)
          yPos += 10
        }

        const maxHeight = 80 // Max height for images
        const maxWidth = 90 // Max width for images

        // Loop through each image in the section
        for (let j = 0; j < section.images.length; j++) {
          const { file } = section.images[j]

          const base64Image = await convertToBase64(file)
          const imgProps = doc.getImageProperties(base64Image)

          // Calculate aspect ratio and maintain original size
          let imgWidth = imgProps.width
          let imgHeight = imgProps.height
          if (imgHeight > maxHeight) {
            imgWidth = (maxHeight * imgWidth) / imgHeight
            imgHeight = maxHeight
          }
          if (imgWidth > maxWidth) {
            imgHeight = (maxWidth * imgHeight) / imgWidth
            imgWidth = maxWidth
          }

          if (yPos + imgHeight > 280) {
            doc.addPage() // Add new page if space is insufficient
            yPos = 20
          }

          const xPos = j % 2 === 0 ? 10 : 110 // First or second column
          doc.addImage(base64Image, 'JPEG', xPos, yPos, imgWidth, imgHeight)

          if (j % 2 === 1) {
            yPos += imgHeight + 10 // Move to the next row after two images
          }
        }

        doc.addPage()
      }

      // Deficiency Report Section
      if (deficiencies.length > 0) {
        doc.setFontSize(50)
        doc.text('Deficiency Report', pageWidth / 2, pageHeight / 2, { align: 'center' })
        doc.addPage()
      }

      // Each deficiency should have a comment and an array of images.

      for (let i = 0; i < deficiencies.length; i++) {
        const deficiency = deficiencies[i]

        let yPos = 20 // Start position for images and comments on each page

        // Add deficiency comment as header
        if (deficiency.comment) {
          if (yPos + 20 > 280) {
            // Check if there's space for the comment
            doc.addPage()
            yPos = 20 // Reset y position on new page
          }
          doc.setFontSize(16) // Font size for the comment text
          doc.text(`Deficiency ${i + 1}: ${deficiency.comment}`, 10, yPos)
          yPos += 10
        }

        const maxHeight = 80 // Max height for images
        const maxWidth = 90 // Max width for images

        // Loop through each image in the deficiency
        for (let j = 0; j < deficiency.images.length; j++) {
          const imageFile = deficiency.images[j].file // Assuming images are already in base64 or file format

          const base64Image = await convertToBase64(imageFile) // Convert image to base64 (if needed)
          const imgProps = doc.getImageProperties(base64Image)

          // Calculate aspect ratio and maintain original size
          let imgWidth = imgProps.width
          let imgHeight = imgProps.height
          if (imgHeight > maxHeight) {
            imgWidth = (maxHeight * imgWidth) / imgHeight
            imgHeight = maxHeight
          }
          if (imgWidth > maxWidth) {
            imgHeight = (maxWidth * imgHeight) / imgWidth
            imgWidth = maxWidth
          }

          // Add image to PDF, handle positioning (similar to Move-In Images)
          if (yPos + imgHeight > 280) {
            doc.addPage() // Add new page if there's no space
            yPos = 20 // Reset y position on new page
          }

          const xPos = j % 2 === 0 ? 10 : 110 // First or second column for images
          doc.addImage(base64Image, 'JPEG', xPos, yPos, imgWidth, imgHeight)

          // Move to the next row after placing two images side-by-side
          if (j % 2 === 1) {
            yPos += imgHeight + 10
          }
        }

        doc.addPage()
      }

      doc.setFontSize(50)
      doc.text('End', pageWidth / 2, pageHeight / 2, { align: 'center' })

      if (action === 'download') {
        // Save the generated PDF
        doc.save(`Move-In-Pictures-${clientName}-${currentDate}.pdf`)
      } else {
        // Save the generated PDF as base64
        const pdfBase64 = doc.output('datauristring')
        console.log('Generated PDF Base64:', pdfBase64)

        const blob = await fetch(pdfBase64).then((res) => res.blob())
        const url = URL.createObjectURL(blob)
        setPdfData(url) // Set Blob URL to be displayed
      }

      setIsLoading(false)
    } catch (error) {
      setIsLoading(false)
      alert(`Error generating PDF: ${error}`)
    }
  }

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  // Function to add a new deficiency report
  const addDeficiency = () => {
    setDeficiencies([...deficiencies, { comment: '', images: [] }])
  }

  // Update comment for a specific deficiency
  const updateDeficiencyComment = (index, comment) => {
    const newDeficiencies = [...deficiencies]
    newDeficiencies[index].comment = comment
    setDeficiencies(newDeficiencies)
  }

  // Handle image upload for a specific deficiency
  const handleDeficiencyImageUpload = (index, files) => {
    const newDeficiencies = [...deficiencies]
    const imagesArray = Array.from(files).map((file) => ({
      id: URL.createObjectURL(file),
      file,
    }))
    newDeficiencies[index].images.push(...imagesArray)
    setDeficiencies(newDeficiencies)
  }

  // Remove image from a specific deficiency
  const removeDeficiencyImage = (deficiencyIndex, imageIndex) => {
    const newDeficiencies = [...deficiencies]
    newDeficiencies[deficiencyIndex].images.splice(imageIndex, 1)
    setDeficiencies(newDeficiencies)
  }

  return (
    <form className='max-w-sm mx-auto'>
      <Overlay isLoading={isLoading} loaderGif={loaderGif} />
      <div className='font-semibold text-center my-5'>Property Visit Documentation</div>
      <FloatingLabel
        variant='filled'
        label='Client Name'
        value={clientName}
        onChange={(e) => setClientName(e.target.value)}
        sizing='sm'
        color={errors.clientName}
      />
      <FloatingLabel
        variant='filled'
        label='Property Name'
        value={propertyName}
        onChange={(e) => setPropertyName(e.target.value)}
        sizing='sm'
        color={errors.propertyName}
      />
      <FloatingLabel
        variant='filled'
        label='Property Address'
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        sizing='sm'
        color={errors.address}
      />
      <div id='fileUpload' className='max-w-md'>
        <Label htmlFor='file' value='Banner Image' />
        <FileInput id='file' sizing='sm' onChange={handleBannerUpload} />
        {bannerImage ? <Image src={bannerImage} alt='Banner Image' width={200} height={300} /> : ''}
      </div>

      <HR />
      <div className='flex gap-4'>
        <h2 className='text-xl font-bold dark:text-white'>Move in images</h2>
        <Button outline gradientDuoTone='purpleToBlue' size='xs' onClick={addSection}>
          +
        </Button>
      </div>
      {sections.map((section, index) => (
        <div key={index} className='my-5'>
          <div className='flex gap-3 items-center'>
            <TextInput
              id={`area-${index}`}
              type='text'
              sizing='sm'
              placeholder='Enter area name'
              value={section.name}
              onChange={(e) => updateAreaName(index, e.target.value)}
            />
            <Button
              gradientDuoTone='purpleToBlue'
              size='xs'
              onClick={() => document.getElementById(`file-input-${index}`).click()}
              className='my-3'
            >
              Add images
            </Button>
          </div>
          <input
            id={`file-input-${index}`}
            type='file'
            accept='image/*'
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleImageUpload(index, e.target.files)}
          />

          <div className='overflow-x-scroll space-x-2 py-2' style={{ maxWidth: '100%', whiteSpace: 'nowrap' }}>
            {section.images.length > 0 &&
              section.images.map((imageObj, imgIndex) => (
                <div key={imgIndex} className='inline-block relative'>
                  <Image
                    src={imageObj.id}
                    alt={`Uploaded Image ${imgIndex}`}
                    width={60}
                    height={40}
                    className='border-2 border-gray-300'
                  />
                  <Button size='xs' className='absolute top-0 right-0' onClick={() => removeImage(index, imgIndex)}>
                    x
                  </Button>
                </div>
              ))}
          </div>
        </div>
      ))}
      <HR />
      <div>
        {/* Deficiency Report Section */}
        <div className='flex gap-4'>
          <h2 className='text-xl font-bold dark:text-white'>Deficiency Report</h2>
          <Button outline gradientDuoTone='purpleToBlue' size='xs' onClick={addDeficiency}>
            +
          </Button>
        </div>

        {deficiencies.map((deficiency, index) => (
          <div key={index}>
            <div className='my-5 flex gap-3 items-center'>
              <Textarea
                id={`comment-${index}`}
                placeholder='Write a note on the deficiency'
                className='p-2'
                required
                rows={4}
                value={deficiency.comment}
                onChange={(e) => updateDeficiencyComment(index, e.target.value)}
              />
              <Button
                gradientDuoTone='purpleToBlue'
                size='xs'
                onClick={() => document.getElementById(`deficiency-file-input-${index}`).click()}
                className='my-3'
              >
                Add images
              </Button>
              <input
                id={`deficiency-file-input-${index}`}
                type='file'
                accept='image/*'
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleDeficiencyImageUpload(index, e.target.files)}
              />
            </div>
            <div className='overflow-x-scroll space-x-2 py-2' style={{ maxWidth: '100%', whiteSpace: 'nowrap' }}>
              {deficiency.images.length > 0 &&
                deficiency.images.map((imageObj, imgIndex) => (
                  <div key={imgIndex} className='inline-block relative'>
                    <Image
                      src={imageObj.id}
                      alt={`Deficiency Image ${imgIndex}`}
                      width={60}
                      height={40}
                      className='border-2 border-gray-300'
                    />
                    <Button
                      size='xs'
                      className='absolute top-0 right-0'
                      onClick={() => removeDeficiencyImage(index, imgIndex)}
                    >
                      x
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      <HR />
      <div className='flex gap-4 my-10'>
        <Button size='xs' onClick={() => generatePDF('download')} className='w-full mt-5' gradientDuoTone='greenToBlue'>
          Generate Report
        </Button>

        {/* New View PDF button */}
        <Button size='xs' onClick={() => generatePDF('view')} className='w-full mt-5' gradientDuoTone='purpleToPink'>
          View PDF
        </Button>
      </div>

      {/* Loader GIF */}
      {isLoading && (
        <div className='my-5 flex justify-center'>
          <Image src={loaderGif} alt='Loading...' width={50} height={50} />
        </div>
      )}

      {/* Embed the PDF in an iframe */}
      {pdfData && (
        <div className='my-5'>
          <iframe src={pdfData} width='100%' height='600px' title='PDF Preview' />
        </div>
      )}
    </form>
  )
}

export default PropertyForm
