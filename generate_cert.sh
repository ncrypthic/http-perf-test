#!/bin/sh
#
# Courtesy of
# https://verifalia.com/help/sub-accounts/how-to-create-self-signed-client-certificate-for-tls-mutual-authentication

OPENSSL_BIN=`which openssl`
OUTPUT_DIR=ssl

echo "Generating CA root..."
echo "Press enter to continue"; read ans;

$OPENSSL_BIN genrsa -aes256 -passout pass:xxxx -out $OUTPUT_DIR/ca.pass.key 4096
$OPENSSL_BIN rsa -passin pass:xxxx -in $OUTPUT_DIR/ca.pass.key -out $OUTPUT_DIR/ca.key
rm $OUTPUT_DIR/ca.pass.key

$OPENSSL_BIN req -new -x509 -days 3650 -key $OUTPUT_DIR/ca.key -out $OUTPUT_DIR/ca.pem

echo "Generating client certificate"
echo "Press enter to continue"; read ans;

$OPENSSL_BIN genrsa -aes256 -passout pass:xxxx -out $OUTPUT_DIR/client.pass.key 4096
$OPENSSL_BIN rsa -passin pass:xxxx -in $OUTPUT_DIR/client.pass.key -out $OUTPUT_DIR/client.key
rm $OUTPUT_DIR/client.pass.key

$OPENSSL_BIN req -new -key $OUTPUT_DIR/client.key -out $OUTPUT_DIR/client.csr

$OPENSSL_BIN x509 -req -days 365 -in $OUTPUT_DIR/client.csr -CA $OUTPUT_DIR/ca.pem -CAkey $OUTPUT_DIR/ca.key -set_serial "01" -addtrust clientAuth -out $OUTPUT_DIR/client.pem

cat $OUTPUT_DIR/client.key $OUTPUT_DIR/client.pem $OUTPUT_DIR/ca.pem > $OUTPUT_DIR/client.full.pem
