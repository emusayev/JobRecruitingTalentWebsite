function filter (desiredResultype) {
  const arrayOfResultTypes = ['studentResults', 'teacherResults', 'employerResults']

  if (desiredResultype === 'all') {
    
   

    for(const connectionResult of document.getElementsByClassName('_connectionResults')) {
      connectionResult.classList.remove('_connectionResults')
      connectionResult.classList.add('connectionResults')
    }

    for (const type of arrayOfResultTypes) {
      const currentElement = document.getElementById(type)

      if (currentElement.hasAttribute('hidden')) {
        currentElement.removeAttribute('hidden')
      }
    }

    for (const header of document.getElementsByClassName('header')) {
      header.removeAttribute('hidden')
    }

  } else {

    for(const connectionResult of document.getElementsByClassName('connectionResults')) {
      connectionResult.classList.remove('connectionResults')
      connectionResult.classList.add('_connectionResults')
    }

    for (const type of arrayOfResultTypes) {
      const currentElement = document.getElementById(type)

      if (type === desiredResultype) {
        if (currentElement.hasAttribute('hidden')) {
          currentElement.removeAttribute('hidden')
        }
      } else {
        if (!currentElement.hasAttribute('hidden')) {
          currentElement.setAttribute('hidden', '')
        }
      }
    }

    for (const header of document.getElementsByClassName('header')) {
      header.setAttribute('hidden', '')
    }
  }
}
