function convertToLocalTime (className) {
  const elements = document.getElementsByClassName(className)
  console.log(new Date(elements.item(0).innerHTML))

  if (elements.length > 0) {
    const tzOffset = (new Date(elements.item(0).innerHTML).getTimezoneOffset()) * 60 * 1000

    console.log(elements)

    for (const element of elements) {
      
      const eleLocalDate = new Date(new Date(element.innerHTML) - tzOffset)
      element.innerHTML = eleLocalDate.toLocaleString()

      // element.innerHTML = `${String(Number(eleLocalDate.getMonth() + 1)).padStart(2, '0')}/${eleLocalDate.getDate().toString().padStart(2, '0')}/${eleLocalDate.getFullYear()}\
      //        - ${eleLocalDate.getHours().toString().padStart(2, '0')}:${eleLocalDate.getMinutes().toString().padStart(2, '0')}`
    }
  }
}
