<route lang="yaml">
meta:
  layout: buyer/account/LBDashboard
</route>
<template>
  <div class="account-panel account-bank-panel">
    <CPaymentMethods /><CAccountMethods kind="bank" />
  </div>
</template>
