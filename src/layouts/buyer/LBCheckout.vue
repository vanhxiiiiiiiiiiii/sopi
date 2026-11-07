<template>
    <div class="checkout-shell">
        <header class="checkout-header">
            <nav class="checkout-nav" aria-label="Điều hướng thanh toán">
                <RouterLink
                    to="/buyer/home"
                    class="checkout-brand"
                    aria-label="E-shopee — Trang chủ"
                >
                    <CSystemBrand />
                </RouterLink>
                <span class="checkout-header-label">Thanh toán</span>
                <RouterLink to="/buyer/cart" class="checkout-cart-link"
                    >Giỏ hàng <span aria-hidden="true">↗</span></RouterLink
                >
            </nav>
        </header>
        <main>
            <router-view />
        </main>
        <footer class="checkout-footer">
            © {{ new Date().getFullYear() }} Shopee <span>·</span>
            <RouterLink to="/contact">Liên hệ hỗ trợ</RouterLink>
        </footer>
    </div>
</template>

<style scoped>
.checkout-shell {
    background: #f5f6f8;
    min-height: 100vh;
    font-family: Arial, Helvetica, sans-serif;
}
.checkout-header {
    background: #fff;
    border-top: 3px solid #ee4d2d;
    border-bottom: 1px solid #e8e9ec;
}
.checkout-nav {
    max-width: 1180px;
    min-height: 85px;
    margin: auto;
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 0 24px;
    box-sizing: content-box;
}
.checkout-brand {
    display: flex;
    align-items: center;
    gap: 9px;
    color: #d94321;
    text-decoration: none;
    font-size: 27px;
    letter-spacing: -1px;
}
.checkout-header-label {
    border-left: 1px solid #e4ccc4;
    color: #9a3a23;
    padding-left: 24px;
    font-size: 18px;
}
.checkout-cart-link {
    margin-left: auto;
    text-decoration: none;
    color: #626a76;
    font-size: 13px;
    display: flex;
    gap: 8px;
    align-items: center;
    min-height: 44px;
}
.checkout-nav a:focus-visible,
.checkout-footer a:focus-visible {
    outline: 3px solid #d96843;
    outline-offset: 5px;
}
.checkout-footer {
    text-align: center;
    border-top: 1px solid #e8e9ec;
    padding: 22px 16px;
    font-size: 12px;
    color: #747c88;
}
.checkout-footer span {
    padding: 0 10px;
}
.checkout-footer a {
    color: inherit;
    text-decoration: none;
}
:global(.dark) .checkout-shell {
    background: #171d26;
}
:global(.dark) .checkout-header {
    background: #202833;
    border-bottom-color: #38404c;
}
:global(.dark) .checkout-brand,
:global(.dark) .checkout-header-label {
    color: #ffac8d;
}
@media (max-width: 600px) {
    .checkout-nav {
        min-height: 72px;
        padding: 0 16px;
        gap: 14px;
    }
    .checkout-brand {
        font-size: 22px;
    }
    .checkout-header-label {
        font-size: 15px;
        padding-left: 14px;
    }
    .checkout-cart-link {
        font-size: 12px;
    }
}
@media (max-width: 370px) {
    .checkout-header-label {
        display: none;
    }
}
</style>
