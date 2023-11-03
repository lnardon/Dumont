function sendRepoLink(){
    const url = document.getElementById("repoLink").value
    fetch("/cloneRepo", {method: "POST", body: JSON.stringify({repo_url: url })}).then(parsed => console.log(parsed))
}
