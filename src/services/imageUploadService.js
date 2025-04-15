/**
 * Service for handling image uploads to third-party services
 * This implementation uses Imgur's API, but can be replaced with any other service
 */
//key from imgur
const IMGUR_CLIENT_ID = "d127bfc324a7bd6" // Replace with your Imgur client ID

/**
 * Uploads an image to Imgur and returns the URL
 * @param {File|Blob|string} imageData - The image to upload (File, Blob, or base64 string)
 * @returns {Promise<string>} - The URL of the uploaded image
 */
export const uploadImageToImgur = async (imageData) => {
  try {
    console.log("Starting image upload to Imgur")

    // Convert File/Blob to base64 if needed
    let base64Image = imageData
    if (imageData instanceof File || imageData instanceof Blob) {
      base64Image = await fileToBase64(imageData)
    } else if (typeof imageData === "string" && imageData.startsWith("data:")) {
      // If it's already a data URL, extract just the base64 part
      base64Image = imageData.split(",")[1]
    }

    // Create form data for the upload
    const formData = new FormData()
    formData.append("image", base64Image)

    // Upload to Imgur
    const response = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Imgur upload failed: ${errorData.data.error}`)
    }

    const result = await response.json()
    console.log("Image uploaded successfully to Imgur")

    // Return the direct image URL
    return result.data.link
  } catch (error) {
    console.error("Error uploading image to Imgur:", error)
    throw new Error(`Failed to upload image: ${error.message}`)
  }
}
//IMBB third party key//
export const uploadImageToImgBB = async (imageData) => {
  const IMGBB_API_KEY = "bb94fc57c4dc580dd1a496b49a6e357b" 

  try {
    console.log("Starting image upload to ImgBB")

    // Convert File/Blob to base64 if needed
    let base64Image = imageData
    if (imageData instanceof File || imageData instanceof Blob) {
      base64Image = await fileToBase64(imageData)
    } else if (typeof imageData === "string" && imageData.startsWith("data:")) {
      // If it's already a data URL, we can use it directly with ImgBB
      base64Image = imageData
    }

    // Create form data for the upload
    const formData = new FormData()
    formData.append("image", base64Image)

    // Upload to ImgBB
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`ImgBB upload failed: ${response.statusText}`)
    }

    const result = await response.json()
    console.log("Image uploaded successfully to ImgBB")

    // Return the direct image URL
    return result.data.url
  } catch (error) {
    console.error("Error uploading image to ImgBB:", error)
    throw new Error(`Failed to upload image: ${error.message}`)
  }
}

/**
 * Helper function to convert a File or Blob to base64
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      // Extract the base64 data from the data URL
      const base64String = reader.result.split(",")[1]
      resolve(base64String)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Upload an image to the configured service
 * This is the main function that should be used by components
 */
export const uploadImage = async (imageData) => {
  // Use ImgBB for uploads
  return await uploadImageToImgBB(imageData)
}
