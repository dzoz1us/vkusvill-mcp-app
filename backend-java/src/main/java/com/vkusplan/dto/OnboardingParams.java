package com.vkusplan.dto;

import java.util.ArrayList;
import java.util.List;

import com.vkusplan.enums.Appliance;
import com.vkusplan.enums.Day;
import com.vkusplan.enums.Diet;
import com.vkusplan.enums.Preference;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingParams {

    private Integer peopleCount;

    @Builder.Default
    private List<Day> days = new ArrayList<>();

    private Double budget;

    @Builder.Default
    private List<Preference> preferences = new ArrayList<>();

    private Diet diet;

    @Builder.Default
    private List<Appliance> appliances = new ArrayList<>();
}