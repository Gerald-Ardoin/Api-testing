<template>
    <div class="popup">
      <div class="popup-inner">
        <h1>Are you sure you want to delete this information?</h1>
        <br><br>
        <div class="confirmation-buttons">
          <button @click="confirmDelete" type="submit" id ="Ybutt" class="bg-green-700 disabled:opacity-50 text-white rounded">Yes</button>
          <button @click="cancelDelete" type="submit" id="Nbutt" class="bg-red-700 disabled:opacity-50 text-white rounded">No</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    methods: {
      confirmDelete() {
        this.$emit("confirmed");
      },
      cancelDelete() {
        this.$emit("canceled");
      },
    },
  };
  </script>


<style>
    .popup {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        z-index: 99;
        background-color: rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .popup-inner {
            background: #FFF;
            padding: 32px;
        }

    .confirmation-buttons {
        position: relative;
        left: 25%;
        align-items: center;
        justify-content: center;
    }

    h1 {
        font-weight: bold;
        padding: 100;
    }

    #Nbutt {
        margin-left: 80px;
    }
</style>