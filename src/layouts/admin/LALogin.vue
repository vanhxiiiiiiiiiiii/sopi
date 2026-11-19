<template>
    <main class="admin-space"><router-view /></main>
</template>
<style>
.admin-space {
    min-height: 100vh;
    background: #f5f6f8;
    padding: 40px 24px;
    color: #30343b;
    font: 14px/1.6 Arial, sans-serif;
}
.admin-panel {
    max-width: 1100px;
    margin: auto;
    background: white;
    padding: 28px;
    border: 1px solid #eee;
    border-radius: 6px;
    text-align: left;
}
.admin-panel h1 {
    font-size: 24px;
    margin: 0 0 20px;
}
.admin-panel input,
.admin-panel textarea {
    display: block;
    border: 1px solid #ddd;
    padding: 11px;
    width: 100%;
    margin: 6px 0 18px;
}
.admin-panel button {
    padding: 10px 18px;
    background: #d94323;
    color: white;
    border: 0;
    border-radius: 3px;
    cursor: pointer;
    margin: 6px;
}
.admin-panel button:disabled {
    opacity: 0.5;
}
.admin-panel article {
    border-top: 1px solid #eee;
    padding: 20px 0;
}
.admin-panel p {
    margin: 8px 0;
}
.admin-login {
    max-width: 420px;
}
.admin-error {
    color: #a33722;
}
</style>
