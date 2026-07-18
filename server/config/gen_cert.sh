#!/usr/bin/env bash
# Genera il certificato self-signed per l'host: nome da argomento o hostname corrente.
# Uso: ./gen_cert.sh [nome-host]   (es. ./gen_cert.sh ENWS27719997)
# NB: config openssl su file temporaneo relativo (la process substitution degli script
# originali non funziona con l'openssl nativo Windows, che non legge i path /proc di MSYS)
name=${1:-$(hostname)}
conf=./gen_cert_$name.cnf
trap 'rm -f "$conf"' EXIT

cat > "$conf" <<-EOF
  [req]
  distinguished_name = req_distinguished_name
  x509_extensions = v3_req
  prompt = no
  [req_distinguished_name]
  CN = $name
  [v3_req]
  keyUsage = keyEncipherment, dataEncipherment
  extendedKeyUsage = serverAuth
  subjectAltName = @alt_names
  [alt_names]
  DNS.1 = $name
  DNS.2 = *.$name
EOF

openssl req \
  -new \
  -newkey rsa:2048 \
  -sha256 \
  -days 3650 \
  -nodes \
  -x509 \
  -keyout $name.key \
  -out $name.crt \
  -config "$conf"
