document.querySelectorAll(".authorLink").forEach(link => {
    link.addEventListener("click", async function () {
      let id = this.id;
  
      let modal = new bootstrap.Modal(document.getElementById("authorModal"));
      modal.show();
  
      let response = await fetch(`/api/author/${id}`);
      let data = await response.json();
      let a = data[0];
  
      document.getElementById("modalAuthorInfo").innerHTML = `
        <img src="${a.picture}" class="img-fluid mb-3">
        <h3>${a.firstName} ${a.lastName}</h3>
        <p>${a.bio}</p>
        <p><strong>Born:</strong> ${a.dob}</p>
        <p><strong>Died:</strong> ${a.dod}</p>
        <p><strong>Profession:</strong> ${a.profession}</p>
        <p><strong>Country:</strong> ${a.country}</p>
      `;
    });
  });
  