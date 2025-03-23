import Image from 'next/image'
export default function LoadingSpinner(){

    return <div className='size-16 relative'>
        <Image src={'/logo.svg'} alt="logo" fill  className=" animate-spin" />
    </div>
}