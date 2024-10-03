import Image from 'next/image'

const Overlay = ({ isLoading, loaderGif }) => {
  if (!isLoading) return null

  return (
    <div className='fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50'>
      <Image src={loaderGif} alt='Loading...' width={50} height={50} />
    </div>
  )
}

export default Overlay
