## Downloading social distancing data

Configure the data to be downloaded using the space-separated `SG_FILE_STUBS` list in the Makefile. For example, to download all files in July and June, set `SG_FILE_STUBS = 2020-07- 2020-06-`.

`make update-sg-data` will then pull all the social distancing data that matches `--exclude '*' --include '*2020-07-*' --include '*2020-06-*'` (this is [AWS-style pattern matching](https://docs.aws.amazon.com/cli/latest/reference/s3/index.html#use-of-exclude-and-include-filters)). SafeGraph data is downloaded into the structure `social-distancing/v2/YYYY/MM/DD/YYYY-MM-DD-social-distancing.gz`. The make target flattens and decompresses all these files into the less redundant structure `social-distancing/YYYY-MM-DD-social-distancing.csv`.

## Processing

1. Download desired data with `make update-sg-data` (requires [`parallel`](https://github.com/spundhir/PARE/issues/4)).
