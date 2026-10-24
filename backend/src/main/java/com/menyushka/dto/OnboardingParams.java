package com.menyushka.dto;

import java.util.ArrayList;
import java.util.List;

import com.menyushka.enums.Appliance;
import com.menyushka.enums.Day;
import com.menyushka.enums.Diet;
import com.menyushka.enums.Preference;

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