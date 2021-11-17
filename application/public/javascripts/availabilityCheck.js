/**
 * Add event listener to email input to check if email is in use.
 * Pass in input id and element to display results.
 * @param {String} responseDisplayId 
 * @param {String} inputId 
 */
async function addEmailListener(responseDisplayId, inputId){

  if(inputId){
      document.getElementById(inputId).addEventListener('input', 
        () => listenAndFetchEmailData(responseDisplayId, inputId)
      )
  }
}

/**
 * Check if input has changed over the duration of 1 second.
 * If not, fetch email data about given email address.
 * @param {String} responseDisplayId 
 * @param {String} inputId 
 */
async function listenAndFetchEmailData(responseDisplayId, inputId) {
  const inputField = document.getElementById(inputId)
  const initialValue = '' + inputField.value

  setTimeout(() => {
      
    if(initialValue === inputField.value && inputField.value.length !== 0){ //if input has not changed after 1s
      fetchEmailData(responseDisplayId, inputField.value)
    }
  }, 1000)
}

/**
 * Modify email address to URL format
 * Fetch information about email address from backend using GET request.
 * Modify DOM to reflect results (response display)
 * @param {String} responseDisplayId 
 * @param {String} emailTextForm 
 */
async function fetchEmailData(responseDisplayId, emailTextForm){
  const responseDisplay = document.getElementById(responseDisplayId)

  if(emailTextForm){
    let emailUrlParams = new URLSearchParams(emailTextForm).toString()
    
    emailUrlParams = emailUrlParams.substring(
      0, 
      emailUrlParams.toString().length - 1
    )
    
    const emailStatus = await fetch(
      `/users/email?email=${emailUrlParams}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    ).then((res) => {
      return res.json();
    });

    if(emailStatus.emailAvailable) {
      responseDisplay.classList.remove('unavailable')
      responseDisplay.classList.add('available')
      responseDisplay.innerHTML = 'Email is available'
    } else {
      responseDisplay.classList.add('unavailable')
      responseDisplay.classList.remove('available')

      if(emailStatus.invalidEmail){
        responseDisplay.innerHTML = 'Invalid Email'
      } else {
        responseDisplay.innerHTML = 'Email is already in use'
      }
    }
  }
}

/**
 * Add event listener to username input to check if username is in use.
 * Pass in input id and element to display results.
 * @param {String} responseDisplayId 
 * @param {String} inputId 
 */
 async function addUsernameListener(responseDisplayId, inputId){

  if(inputId){
    document.getElementById(inputId).addEventListener('input', 
      () => listenAndFetchUsernameData(responseDisplayId, inputId)
    )
  }
}

/**
 * Check if input has changed over the duration of 1 second.
 * If not, fetch username data about given username.
 * @param {String} responseDisplayId 
 * @param {String} inputId 
 */
async function listenAndFetchUsernameData(responseDisplayId, inputId) {
  const inputField = document.getElementById(inputId)
  const initialValue = '' + inputField.value

  setTimeout(() => {
      
    if(initialValue === inputField.value && inputField.value.length !== 0){ //if input has not changed after 1s
      fetchUsernameData(responseDisplayId, inputField.value)
    }
  }, 1000)
}

/**
 * Modify username to URL format
 * Fetch information about username from backend using GET request.
 * Modify DOM to reflect results (response display)
 * @param {String} responseDisplayId 
 * @param {String} usernameTextForm 
 */
 async function fetchUsernameData(responseDisplayId, usernameTextForm){
  const responseDisplay = document.getElementById(responseDisplayId)

  if(usernameTextForm){
    let usernameUrlParams = new URLSearchParams(usernameTextForm).toString()
    
    usernameUrlParams = usernameUrlParams.substring(
      0, 
      usernameUrlParams.toString().length - 1
    )
    
    const usernameStatus = await fetch(
      `/users/username?username=${usernameUrlParams}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    ).then((res) => {
      return res.json();
    });

    if(usernameStatus.usernameAvailable) {
      responseDisplay.classList.remove('unavailable')
      responseDisplay.classList.add('available')
      responseDisplay.innerHTML = 'Username is available'
    } else {
      responseDisplay.classList.add('unavailable')
      responseDisplay.classList.remove('available')

      if(usernameStatus.invalidUsername){
        responseDisplay.innerHTML = 'Invalid username'
      } else {
        responseDisplay.innerHTML = 'Username is already in use'
      }  
    }
  }
}