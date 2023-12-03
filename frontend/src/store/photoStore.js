import { defineStore } from 'pinia';
import { uploadProfileImg, deleteProfileImage } from '../api/api';

export const usePhotoStore = defineStore('photo', {
  state: () => ({
    currentPhoto: null,
  }),
  actions: {
    async uploadPhoto(formData) {
      try {
        const response = await uploadProfileImg(formData);
        this.currentPhoto = response.user.profileImg;
        return response;
      } catch (error) {
        throw error;
      }
    },
    async deletePhoto(filename) {
      try {
        const response = await deleteProfileImage(filename); // Updated API call
        this.currentPhoto = null;
        return response;
      } catch (error) {
        throw error;
      }
    },
  },
});
