library(tidyverse)

writeChanges <- function(date1, date2, filename = "../data/home_panel_change.csv") {
  augData <- read.csv(paste(date1, "home-panel-summary.csv", sep = "-")) %>% filter(grepl("^36061", census_block_group))
  octData <- read.csv(paste(date2, "home-panel-summary.csv", sep = "-")) %>% filter(grepl("^36061", census_block_group))
  
  merge(augData, octData, by='census_block_group', all = TRUE) %>% 
    rename(aug = number_devices_residing.x, oct = number_devices_residing.y) %>% 
    mutate(census_tract = floor(census_block_group / 10)) %>% 
    group_by(census_tract) %>% 
    summarize(aug = sum(aug, na.rm = TRUE), oct = sum(oct, na.rm = TRUE)) %>% 
    write.csv(filename, row.names = FALSE)
}

writeChanges("2020-08-24", "2020-10-26")
writeChanges("2019-08-19", "2019-10-21")
