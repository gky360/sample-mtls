# sample-mtls

## local

```sh
mkdir ./certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./certs/server.key -out ./certs/server.crt
docker run --rm -p 8443:8443 -v $PWD/index.html:/www/data/index.html:ro -v $PWD/nginx-log:/var/log/nginx -v $PWD/certs:/certs:ro -v $PWD/nginx.conf:/etc/nginx/conf.d/nginx.conf:ro nginx
```

Open https://localhost:8443/

## AWS cdk

1. Put `truststore.pem` into `cdk/data/certificate/` .
1. Set `SAMPLE_MTLS_ACCOUNT` , `SAMPLE_MTLS_CERTIFICATE_ARN` , and `SAMPLE_MTLS_DOMAIN_NAME` environment variables.
1. Run `cd cdk && cdk deploy`
