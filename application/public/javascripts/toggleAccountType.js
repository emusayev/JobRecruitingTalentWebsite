function toggleAccountType () {
  const elementIndividual = document.getElementById('individual-form')
  const elementOrg = document.getElementById('org-form')
  const button = document.getElementById('account-selector')

  if (elementIndividual.style.display === 'none') {
    elementIndividual.style.display = 'flex'
    elementOrg.style.display = 'none'
    button.innerHTML = 'Register Your Organization'

    Array.prototype.slice.call(document.querySelector('#org-form').querySelectorAll('*')).forEach(child => {
      if (child.name) {
        child.removeAttribute('required')
        child.name = child.name + '_'
      }
    })

    Array.prototype.slice.call(document.querySelector('#individual-form').querySelectorAll('*')).forEach(child => {
      if (child.name) {
        child.setAttribute('required', '')
        child.name = child.name.substring(0, child.name.length - 1)
      }
    })
  } else {
    elementOrg.style.display = 'flex'
    elementIndividual.style.display = 'none'
    button.innerHTML = 'Register As An Individual'

    Array.prototype.slice.call(document.querySelector('#individual-form').querySelectorAll('*')).forEach(child => {
      if (child.required) {
        child.removeAttribute('required')
        child.name = child.name + '_'
      }
    })

    Array.prototype.slice.call(document.querySelector('#org-form').querySelectorAll('*')).forEach(child => {
      if (child.name) {
        child.setAttribute('required', '')
        child.name = child.name.substring(0, child.name.length - 1)
      }
    })
  }
}
