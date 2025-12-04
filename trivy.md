# Trivy Local Usage Guide
*Trivy is an all-in-one security scanner that detects vulnerabilities, misconfigurations, secrets, SBOMs, and more.*

## 1. Install Trivy

#### for Linux/MACOS

```bash
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sudo sh -s --
```

## 2. Verify Installation

```bash
trivy --version
```

## 3. Scaning Infrastructure

**Terraform**
```bash
trivy config ./infrastructure
```

**CDKTF**

```bash
cdktf synth
trivy config ./cdktf.out
```

### 4. Scan a Filesystem

```bash
trivy fs .
```

### 5. Scan for Secrets in Code

```bash
trivy fs --security-checks secret .
```

## 6. Output formats

- table -> default 
- JSON -> ```trivy fs --format json --output trivy-report.json .```
- SARIF -> ```trivy fs --format sarif --output report.sarif .```


### also, you can give flag for which severity to show

by ```--severity <HIGH/MEDIUM/CRITICAL/LOW>``` 







