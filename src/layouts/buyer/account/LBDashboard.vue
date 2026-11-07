<script setup>
import AccountRequest from '~/services/account-request'
import { useUser } from '~/stores/user'
const router = useRouter()
const user = useUser()
onActivated(async () => {
    if (!localStorage.getItem('token')) {
        router.replace('/buyer/login')
        return
    }
    try {
        const { data } = await AccountRequest.getProfile()
        user.payget = data
        user.profile = data.profile ?? {}
    } catch {
        // Each account page reports its own data loading errors.
    }
})
</script>
<template>
    <div class="account-shell">
        <CBHeaderTop /><CBHead />
        <div class="account-area">
            <div class="account-frame">
                <CBAccount />
                <main class="account-content"><router-view /></main>
            </div>
        </div>
        <CBFooter />
    </div>
</template>
<style src="~/styles/account.css"></style>
