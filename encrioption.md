# How AWS Encryption Works
#### S3 + KMS as an example:

1. You upload a file to S3.
2. AWS KMS generates a data key (symmetric encryption key) for that file.
3. AWS encrypts the file using that data key.
4. The data key itself is encrypted using a master key in KMS.
5. Only someone with permission to use the KMS key can decrypt the data.


## Pricing

Encryption itself is mostly free, but KMS keys cost extra:
SSE-S3: No additional cost. Only pay for storage and requests.
SSE-KMS:
$1 per key per month (Customer Managed Key)
$0.03 per 10,000 requests to use the key (encrypt/decrypt operations)
SSE-C: No extra AWS cost, but you manage keys yourself (security responsibility).
Example:If you have 1 million S3 GET requests with SSE-KMS, that’s:
1,000,00010,000×0.03=100×0.03=$3\frac{1,000,000}{10,000} \times 0.03 = 100 \times 0.03 = \$310,0001,000,000​×0.03=100×0.03=
#### $3
per month, just for key usage.


## Performance / Latency Considerations

Does it slow things down?Slightly, yes, but usually barely noticeable for most workloads.
Encrypting/decrypting is done in milliseconds on AWS servers.
You may notice a minor increase in latency for very high throughput applications (e.g., streaming TBs per second).