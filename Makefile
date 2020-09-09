#####################
# CUSTOM PARAMETERS #
#####################

# List file stubs to use to download SG data
SG_FILE_STUBS := 2020-07-25


#############
# CONSTANTS #
#############

# Set number of parallel jobs to number of available processors
NPROCS = $(shell sysctl hw.ncpu | grep -o '[0-9]\+')
MAKEFLAGS += -j$(NPROCS)

# Directory names
OUTPUT_TARGET = .
INPUT_TARGET = social-distancing

# List all the dates to filter and do processing on
DATES := $(wildcard $(INPUT_TARGET)/*.csv)

FILTER_DIR = $(OUTPUT_TARGET)/data-filtered

DATE_SLUGS := $(DATES:$(INPUT_TARGET)/%-social-distancing.csv=%)
DATES = $(addsuffix .csv,$(DATE_SLUGS))


#####################
# SOCIAL DISTANCING #
#####################

tk: $(addprefix $(FILTER_DIR)/,$(DATES))

$(FILTER_DIR)/%.csv: $(INPUT_TARGET)/%-social-distancing.csv
	./main.py -filter $< > $@


###################
# REFRESH SG DATA #
###################

.PROXY: update-sg-data

update-sg-data:
	aws s3 sync s3://sg-c19-response/social-distancing/v2/ $(INPUT_TARGET) \
		--profile safegraphws \
		--endpoint https://s3.wasabisys.com \
		--exclude '*' \
		$(SG_FILE_STUBS:%=--include '*%*')

	# Flatten directory structure since YYYY-MM-DD already in the filename
	- find $(INPUT_TARGET)/{2020,2019} -type f -exec mv -i '{}' $(INPUT_TARGET) ';'

	# Unzip everything in parallel
	- find $(INPUT_TARGET) -name '*.gz' -print0 | parallel -q0 gunzip -k

	# (Optional) Remove compressed files
	rm $(INPUT_TARGET)/*.gz
	rm -r $(INPUT_TARGET)/2020
