package com.example.catalog.Model;

import jakarta.persistence.*;

@Entity
@Table(name = "authors")
public class Author {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 100)
    private String name;
    @Column(columnDefinition = "text")
    private String bio;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String value) { name = value; }
    public String getBio() { return bio; }
    public void setBio(String value) { bio = value; }
}
