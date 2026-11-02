package com.example.catalog.Model;

import jakarta.persistence.*;

@Entity
@Table(name = "categories")
public class Category {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 100)
    private String name;
    @Column(columnDefinition = "text")
    private String description;
    @Column(name = "normalized_name", nullable = false, unique = true, length = 100)
    private String normalizedName;
    public void setNormalizedName(String value) { normalizedName = value; }
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String value) { name = value; }
    public String getDescription() { return description; }
    public void setDescription(String value) { description = value; }
}
