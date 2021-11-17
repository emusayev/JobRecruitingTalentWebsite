async function urlFetch (url) {
  await fetch(url, { method: 'POST', credentials: 'include' })
  // .then((res) => {
  //     // location.replace(res.url);
  //     window.location.href = res.url;
  // })
}

async function urlFetchAndFollow (url) {
  await fetch(url, { method: 'POST', credentials: 'include', redirect: 'follow' })

}

function hideAndFetch (id, url) {
  const element = document.getElementById(id)
  element.remove()
  urlFetch(url)
}


function applyAndFetch (id, url) {
  const eleButton = document.getElementById(id)
  eleButton.innerHTML = 'Applied'
  eleButton.disabled = true

  urlFetch(url)
    .catch(response => {

    })
}
