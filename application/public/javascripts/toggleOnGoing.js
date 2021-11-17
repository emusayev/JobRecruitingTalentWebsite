function toggleOnGoing (checkbox, date) {
  const eleCheckBox = document.getElementById(checkbox)
  const eleDate = document.getElementById(date)

  if (eleCheckBox && eleDate) {
    if (eleCheckBox.checked) {
      eleDate.style.visibility = 'hidden'
      eleDate.setAttribute('required', '')
      eleDate.removeAttribute('required')
    } else {
      eleDate.style.visibility = 'visible'
      eleDate.removeAttribute('required')
    }
  }
}

function toggleHideElement (element) {
  const ele = document.getElementById(element)

  if (ele.style.visibility === 'hidden') {
    ele.style.visibility = 'visible'
  } else {
    ele.style.visibility = 'hidden'
  }
}
