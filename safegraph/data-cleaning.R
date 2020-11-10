library(tidyverse)

augData <- read.csv("2020-08-19-home_panel_summary.csv") %>% filter(grepl("^36061", census_block_group))
octData <- read.csv("2020-10-21-home_panel_summary.csv") %>% filter(grepl("^36061", census_block_group))

merge(augData, octData, by='census_block_group', all = TRUE) %>% 
  rename(aug = number_devices_residing.x, oct = number_devices_residing.y) %>% 
  mutate(census_tract = floor(census_block_group / 10)) %>% 
  group_by(census_tract) %>% 
  summarize(aug = sum(aug, na.rm = TRUE), oct = sum(oct, na.rm = TRUE)) %>% 
  write.csv("../data/home_panel_change.csv", row.names = FALSE)
