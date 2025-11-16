// VARIABLES GLOBALES
let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// CARGAR PRODUCTOS DE LA API
async function loadProducts() {
    const res = await fetch("https://fakestoreapi.com/products");
    products = await res.json();
    displayProducts();
}
loadProducts();

// MOSTRAR PRODUCTOS EN CARDS
function displayProducts() {
    const list = document.getElementById("product-list");
    list.innerHTML = "";

    products.forEach(p => {
        list.innerHTML += `
        <div class="col-md-4 mb-4">
            <div class="card shadow">
                <img src="${p.image}" class="card-img-top" style="height: 250px; object-fit: contain;">
                <div class="card-body">
                    <h5 class="card-title">${p.title}</h5>
                    <p class="text-primary fw-bold">$${p.price}</p>
                    <button class="btn btn-primary w-100" onclick="openModal(${p.id})">Ver más 🔍</button>
                </div>
            </div>
        </div>`;
    });
}

// ABRIR MODAL CON DATOS DEL PRODUCTO
function openModal(id) {
    const p = products.find(x => x.id === id);

    document.getElementById("modalTitle").innerText = p.title;
    document.getElementById("modalImage").src = p.image;
    document.getElementById("modalDescription").innerText = p.description;
    document.getElementById("modalPrice").innerText = "$" + p.price;

    document.getElementById("modalQuantity").value = 1;
    document.getElementById("modalQuantity").dataset.id = id;

    new bootstrap.Modal(document.getElementById("productModal")).show();
}

// AGREGAR AL CARRITO DESDE EL MODAL
function addToCartFromModal() {
    const id = parseInt(document.getElementById("modalQuantity").dataset.id);
    const qty = parseInt(document.getElementById("modalQuantity").value);

    const product = products.find(p => p.id === id);
    const existing = cart.find(i => i.id === id);

    if (existing) existing.qty += qty;
    else cart.push({ id, title: product.title, price: product.price, qty });

    saveCart();
    updateCart();
    alert("Producto agregado 🛒");
}

// MOSTRAR Y OCULTAR CARRITO
function toggleCart() {
    document.getElementById("cart-sidebar").classList.toggle("active");
}

// ACTUALIZAR CARRITO
function updateCart() {
    const list = document.getElementById("cart-items");
    const total = document.getElementById("cart-total");
    const count = document.getElementById("cart-count");

    list.innerHTML = "";
    let sum = 0;
    let items = 0;

    cart.forEach(item => {
        sum += item.price * item.qty;
        items += item.qty;

        list.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <img src="${products.find(p => p.id === item.id).image}">
                <div>
                    <strong>${item.title}</strong><br>
                    Cant: ${item.qty} - $${item.price}
                </div>
                <button class="btn btn-danger" onclick="removeItem(${item.id})">🗑️</button>
            </li>
        `;
    });

    total.innerText = sum.toFixed(2);
    count.innerText = items;
}
updateCart();

// ELIMINAR PRODUCTO
function removeItem(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCart();
}

// GUARDAR EN LOCALSTORAGE
function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

// ABRIR PAGO
function openPayment() {
    new bootstrap.Modal(document.getElementById("paymentModal")).show();
}

// PROCESAR PAGO + GENERAR PDF
function processPayment() {

    const name = document.getElementById("payName").value.trim();
    const card = document.getElementById("payCard").value.trim();
    const date = document.getElementById("payDate").value.trim();
    const cvv = document.getElementById("payCVV").value.trim();

    if (!name || !card || !date || !cvv) {
        alert("Completa todos los campos ❗");
        return;
    }

    generateTicketPDF(name);
    alert("Pago realizado con éxito ✅");

    cart = [];
    saveCart();
    updateCart();
}

// GENERAR PDF TÉRMICO
function generateTicketPDF(name) {
    const { jsPDF } = window.jspdf;
    
    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [58, 200]  // Ancho tipo ticket térmico
    });

    pdf.setFont("courier", "normal");
    pdf.setFontSize(10);

    pdf.text("SHOPMASTER - TICKET DE COMPRA", 4, 10);
    pdf.text(`Cliente: ${name}`, 4, 20);
    pdf.text(`Fecha: ${new Date().toLocaleString()}`, 4, 26);

    let y = 40;
    pdf.text("PRODUCTOS:", 4, y);
    y += 6;

    cart.forEach(item => {
        pdf.text(`${item.title.substring(0,18)}`, 4, y);
        pdf.text(`x${item.qty}`, 4, y + 5);
        pdf.text(`$${item.price}`, 40, y);
        y += 10;
    });

    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    pdf.text(`TOTAL: $${total.toFixed(2)}`, 4, y + 10);

    pdf.save("ticket_compra.pdf");
}
