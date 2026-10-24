#!/usr/bin/env bash
# Publica o ALB CLIN no Netlify. Execute dentro desta pasta, no terminal do seu computador.
set -e
npm install
npx --yes netlify-cli login
npx --yes netlify-cli sites:create --name alb-clin-$(date +%s) || true
npx --yes netlify-cli env:set CLINIC_PASSWORD "$1"
npx --yes netlify-cli deploy --prod --dir . --functions netlify/functions
